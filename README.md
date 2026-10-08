# Treasure Quiz

เกมตอบคำถามและสุ่มหีบรางวัลสำหรับเล่นกันสองคน โดยแยกเว็บไซต์และ
repository ออกจาก RingQuiz แต่ยังใช้ Supabase project เดิม
(`lfvwdeqfyscalfucfhlp`)

## เข้าเล่น

- Host: <https://boss-kung.github.io/treasure-quiz/#/host>
- Player: <https://boss-kung.github.io/treasure-quiz/#/play>

GitHub Pages เป็นเว็บไซต์สาธารณะ แต่การเข้า Host และ Player ยังต้องผ่าน PIN
ที่ตรวจสอบโดย Supabase Edge Functions ห้ามใส่ PIN หรือ Supabase secret ลงใน
repository นี้

## พัฒนาในเครื่อง

1. คัดลอก `.env.example` เป็น `.env.local`
2. กำหนด `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`
3. รัน `npm ci`
4. รัน `npm run dev`

คำสั่งตรวจสอบหลัก:

```bash
npm test -- --run
npm run build
npm run test:e2e
```

## นำเข้าคำถามจากไฟล์

ในหน้า Host Setup กดดาวน์โหลด template CSV หรือ Excel แล้วกรอกคอลัมน์:

`round_no`, `position`, `question_type`, `prompt`, `keyword`, `choices`, `correct_answer`, `difficulty`

คั่นตัวเลือกในช่อง `choices` ด้วย `|` เช่น `A|B|C` จากนั้นอัปโหลดไฟล์เพื่อดู
preview และข้อผิดพลาดรายแถวก่อนกดยืนยันนำเข้า คำถามเดิมจะถูกแทนที่ทั้งชุดเมื่อกดยืนยันเท่านั้น

## Deploy

Workflow ใน `.github/workflows/deploy.yml` จะ deploy ทุกครั้งที่ push เข้า
`main` โดยต้องมี repository secret ชื่อ `VITE_SUPABASE_ANON_KEY`
