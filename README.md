!! สร้างขึ้นด้วย ChatGPT !! 
ไฟล์:
- `index.html` — ตัวเว็บไซต์
- `CSW24.txt` — word list จากไฟล์ที่อัปโหลด
- `README.txt` — วิธีใช้งาน

ความสามารถ:
- กำหนดความยาวศัพท์เป็นจำนวนตัวอักษร
- กำหนดจำนวนศัพท์
- สุ่มศัพท์จาก CSW24
- แสดง Anagram ที่พบใน CSW24
- เรียง A-Z ได้
- Export PNG / JPG
- Export PDF ผ่าน Print → Save as PDF
- เลือกไฟล์ CSW24.txt เองได้ หาก browser ไม่อนุญาตให้ fetch ไฟล์ local

จำนวนคำที่อ่านได้และไม่ซ้ำ: 280,887

การเปิดแบบแนะนำ:
1. วาง `index.html` และ `CSW24.txt` ไว้โฟลเดอร์เดียวกัน
2. เปิดผ่าน local web server เช่น VS Code Live Server
3. หรือเปิด index.html แล้วเลือก `CSW24.txt` ในช่องไฟล์ หาก browser บล็อกการโหลดไฟล์ local

เพิ่มเติม:
- คอลัมน์ Letters จะแสดง signature ของคำโดยเรียงตัวอักษร A→Z
- ตัวอย่าง CARTOON และ CORANTO จะมี signature เดียวกันคือ ACNOORT
- ดังนั้น Anagram ของ CARTOON จะแสดง CORANTO และคำอื่นใน CSW24 ที่มี signature เดียวกัน
