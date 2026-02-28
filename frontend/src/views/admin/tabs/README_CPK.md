# CPK Analysis Documentation (คู่มือการคำนวณ)

เอกสารนี้รวบรวมสูตรการคำนวณและหลักสถิติที่ใช้ในโมดูล **CPK Analysis** ของระบบ YTRC MRP

## 1. นิยามดัชนีความสามารถ (Capability Indices)

ระบบรองรับการคำนวณดัชนีหลัก 2 กลุ่ม ตามมาตรฐานสถิติอุตสาหกรรม (SPC):

### กลุ่มที่ 1: Potential Capability (Cp, Cpk)

ประเมินศักยภาพของกระบวนการโดยใช้ความผันแปร **ภายในกลุ่มย่อย (Within Subgroup)**

- **Cp (Process Capability):** ความสามารถสูงสุดที่เป็นไปได้เมื่อกระบวนการอยู่ตรงกลางเป้าหมายพอดี
  - $$Cp = \frac{USL - LSL}{6\sigma_{within}}$$
- **Cpk (Process Capability Index):** ความสามารถที่แท้จริง โดยพิจารณาการเบี่ยงเบนของค่าเฉลี่ย
  - $$Cpk = \min\left(\frac{USL - \mu}{3\sigma_{within}}, \frac{\mu - LSL}{3\sigma_{within}}\right)$$

### กลุ่มที่ 2: Process Performance (Pp, Ppk)

ประเมินผลการทำงานจริงโดยใช้ความผันแปร **ทั้งหมด (Overall)** จากทุกข้อมูล

- **Pp (Process Performance):**
  - $$Pp = \frac{USL - LSL}{6\sigma_{overall}}$$
- **Ppk (Process Performance Index):**
  - $$Ppk = \min\left(\frac{USL - \mu}{3\sigma_{overall}}, \frac{\mu - LSL}{3\sigma_{overall}}\right)$$

---

## 2. การคำนวณส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation)

### Overall Standard Deviation ($\sigma_{overall}$)

คำนวณแบบ Sample Standard Deviation ปกติจากข้อมูลทั้งหมด $n$ ตัว:
$$\sigma_{overall} = \sqrt{\frac{\sum_{i=1}^{n}(x_i - \bar{x})^2}{n - 1}}$$

### Within Standard Deviation ($\sigma_{within}$)

คำนวณโดยใช้วิธี **Pooled Standard Deviation** หารด้วยค่าคงที่ปรับแก้ $c_4$ (Unbiasing Constant):
$$\sigma_{within} = \frac{s_p}{c_4}$$
_หมายเหตุ: ค่า $c_4$ จะเปลี่ยนไปตามจำนวน Degree of Freedom ($df$) ของกลุ่มตัวอย่าง_

---

## 3. เกณฑ์การแปลผล (Interpretation Guide)

| ค่า Cpk / Ppk   | ความหมาย                | สถานะกระบวนการ              |
| :-------------- | :---------------------- | :-------------------------- |
| **< 1.00**      | ไม่เพียงพอ (Inadequate) | ผลิตของเสียนอก Spec แน่นอน  |
| **1.00 - 1.33** | พอใช้ (Marginal)        | ต้องควบคุมอย่างใกล้ชิด      |
| **1.33 - 1.67** | ดี (Satisfactory)       | มาตรฐานอุตสาหกรรมทั่วไป     |
| **> 1.67**      | ดีเยี่ยม (Excellent)    | กระบวนการมีความเสถียรสูงมาก |

> [!TIP]
> **ความแตกต่างระหว่าง Cp และ Cpk:**
>
> - ถ้า **Cp สูง แต่ Cpk ต่ำ**: แสดงว่าเครื่องจักรมีความแม่นยำ (Precision) ดีมาก แต่ตำแหน่ง (Accuracy) ผิดพลาด ให้ทำการปรับจูน Center point ใหม่

---

## 4. รายละเอียดทางเทคนิค (Technical Spec)

- **Frontend:** Vue 3 (Composition API)
- **Charts:** ApexCharts (ใช้แสดง X-Bar และ Histogram with Density Curve)
- **Export:** ExcelJS พร้อมระบบ Html2Canvas สำหรับแนบรูปกราฟลงในไฟล์ Excel
- **Data Input:** รองรับการ Copy-Paste ข้อมูลจาก Excel หรือการคีย์ข้อมูลดิบแยกด้วยช่องว่าง/บรรทัด
