import { Injectable, Logger } from '@nestjs/common';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlcService } from './plc.service';

@WebSocketGateway({
    namespace: 'plc',
    cors: {
        origin: true,
        credentials: true,
    },
})
@Injectable()
export class PlcGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(PlcGateway.name);
    private pollingInterval: NodeJS.Timeout | null = null;

    constructor(private readonly plcService: PlcService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        // Send initial status
        client.emit('connection-status', this.plcService.getStatus());

        // Start polling if not already started
        this.startPolling();
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // If no clients left, we could stop polling to save resources
        if (this.server.engine.clientsCount === 0) {
            this.stopPolling();
        }
    }

    private startPolling() {
        if (this.pollingInterval) return;

        this.pollingInterval = setInterval(async () => {
            try {
                const [markers, db26Data, db54Data] = await Promise.all([
                    this.plcService.readMarkers26(),
                    this.plcService.readDb26().catch(() => null),
                    this.plcService.readDb54().catch(() => null),
                ]);

                if (markers) this.server.emit('marker-data', markers);
                if (db26Data) this.server.emit('db-data', db26Data);
                if (db54Data) this.server.emit('db54-data', db54Data);

                // Also broadcast connection status
                this.server.emit('connection-status', this.plcService.getStatus());
            } catch (error) {
                // Silently handle errors to avoid log spamming
            }
        }, 1000);
    }

    private stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    @SubscribeMessage('read-db')
    async handleReadDb() {
        try {
            const data = await this.plcService.readDb26();
            return { event: 'db-data', data };
        } catch (e) {
            return { event: 'plc-error', data: { message: e.message } };
        }
    }

    @SubscribeMessage('write-and-pulse')
    async handleWriteAndPulse(@MessageBody() values: number[]) {
        try {
            await this.plcService.writeDb26(values);
            return { event: 'write-success', data: { message: 'Write to DB26 and Pulse successful' } };
        } catch (e) {
            return { event: 'plc-error', data: { message: e.message } };
        }
    }

    @SubscribeMessage('write-line-use')
    async handleWriteLineUse(@MessageBody() data: { bit: number; value: boolean }) {
        try {
            await this.plcService.writeLineUse26(data.bit, data.value);
            return { success: true };
        } catch (e) {
            return { event: 'plc-error', data: { message: e.message } };
        }
    }

    @SubscribeMessage('db54-read')
    async handleDb54Read() {
        try {
            const data = await this.plcService.readDb54();
            return { event: 'db54-data', data };
        } catch (e) {
            return { event: 'plc-error', data: { message: e.message } };
        }
    }

    @SubscribeMessage('db54-write-and-pulse')
    async handleDb54Write(@MessageBody() data: any) {
        try {
            await this.plcService.writeDb54(data);
            return { event: 'db54-write-success', data: { message: 'Write to DB54 and Pulse successful' } };
        } catch (e) {
            return { event: 'plc-error', data: { message: e.message } };
        }
    }
}
