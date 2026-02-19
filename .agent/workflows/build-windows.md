---
description: Build the Windows application installer (.exe) and prepare for release.
---

1.  **Check Current Version**
    First, check the current version in `package.json` to ensure it's what you intend to build.

    ```bash
     grep "\"version\":" frontend/package.json
    ```

2.  **Build Application**
    Run the build command. This will compile the source and create the installer.
    // turbo

    ```bash
     cd frontend && npm run build:win
    ```

3.  **Verify Output**
    Confirm the installer and update files were created successfully.

    ```bash
     ls -R frontend/dist/release
    ```

4.  **Deployment Instructions**
    To release this update:
    1.  Take the files from `frontend/dist/release/<version>/`:
        - `YTRC-Desktop-Windows-<version>-Setup.exe`
        - `latest.yml`
    2.  Upload them to your update server: `https://app.ytrc.co.th/updates`
