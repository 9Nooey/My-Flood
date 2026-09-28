const fs = require('fs');
const path = require('path');

async function updateWaterData() {
  console.log('เริ่มดึงข้อมูลสถานการณ์น้ำ...');

  // ในการใช้งานจริง สามารถใช้ fetch() ดึงจาก API ของ HII หรือ กทม. ได้
  // ตัวอย่างการใช้ API Key จาก GitHub Secrets: process.env.THAIWATER_API_KEY
  const waterPayload = {
    timestamp: new Date().toISOString(),
    overview: {
      bangSaiFlowRate: 2180, // ลบ.ม./วินาที
      bangSaiStatus: 'warning',
      seaLevelRise: '+1.65 ม. รทก.',
      peakSeaTime: '18:45 น.',
      rainStatus: 'ตรวจพบกลุ่มฝนเล็กน้อยโซนตะวันออก'
    },
    stations: [
      // === กทม. ตะวันออก ===
      {
        id: 'E01',
        name: 'คลองแสนแสบ (ประตูระบายน้ำมีนบุรี)',
        zone: 'east',
        lat: 13.8138,
        lng: 100.7483,
        waterLevel: 0.88,
        bankLevel: 1.20,
        status: 'normal',
        description: 'รับน้ำหลากจากคลองสิบสามและพื้นที่หนองจอก'
      },
      {
        id: 'E02',
        name: 'คลองลาดพร้าว (วัดสว่างโสภณ)',
        zone: 'east',
        lat: 13.8211,
        lng: 100.5982,
        waterLevel: 1.48,
        bankLevel: 1.50,
        status: 'critical',
        description: 'ระดับน้ำใกล้ล้นตลิ่ง เดินเครื่องสูบเต็มกำลัง'
      },
      {
        id: 'E03',
        name: 'สถานีสูบน้ำพระโขนง',
        zone: 'east',
        lat: 13.7088,
        lng: 100.5958,
        waterLevel: -0.15,
        bankLevel: 1.00,
        status: 'normal',
        description: 'ทางระบายน้ำหลักฝั่งตะวันออกลงสู่แม่น้ำเจ้าพระยา'
      },
      // === กทม. ตะวันตก ===
      {
        id: 'W01',
        name: 'คลองทวีวัฒนา (ประตูระบายน้ำทวีวัฒนา)',
        zone: 'west',
        lat: 13.7854,
        lng: 100.3541,
        waterLevel: 1.85,
        bankLevel: 2.10,
        status: 'warning',
        description: 'เฝ้าระวังน้ำหลากจาก จ.นนทบุรี และนครปฐม'
      },
      {
        id: 'W02',
        name: 'คลองมหาสวัสดิ์ (ประตูน้ำฉิมพลี)',
        zone: 'west',
        lat: 13.8012,
        lng: 100.4325,
        waterLevel: 1.62,
        bankLevel: 2.00,
        status: 'normal',
        description: 'ผันน้ำลงแม่น้ำท่าจีน'
      },
      {
        id: 'W03',
        name: 'คลองบางกอกน้อย (ปากคลอง)',
        zone: 'west',
        lat: 13.7615,
        lng: 100.4852,
        waterLevel: 1.78,
        bankLevel: 2.20,
        status: 'warning',
        description: 'ได้รับผลกระทบจากภาวะน้ำทะเลหนุนสูง'
      }
    ]
  };

  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'water.json');
  fs.writeFileSync(outputPath, JSON.stringify(waterPayload, null, 2), 'utf-8');
  console.log(`บันทึกข้อมูลเรียบร้อยที่: ${outputPath}`);
}

updateWaterData().catch(err => {
  console.error(err);
  process.exit(1);
});
