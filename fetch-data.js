const fs = require('fs');
const path = require('path');

async function updateWaterData() {
  console.log('กำลังรวบรวมข้อมูลสถานการณ์น้ำและข่าวสาร...');

  const waterPayload = {
    timestamp: new Date().toISOString(),
    overview: {
      bangSaiFlowRate: 2180,
      bangSaiStatus: 'warning',
      seaLevelRise: '+1.65 ม. รทก.',
      peakSeaTime: '18:45 น.',
      rainStatus: 'มีฝนฟ้าคะนองกระจายตัวบริเวณภาคตะวันออกและปริมณฑล'
    },
    // ข่าวสารและการแจ้งเตือนภัยแยกตามจังหวัด/โซน
    news: [
      {
        id: 'N01',
        province: 'prachinburi',
        title: 'ปภ. ปราจีนบุรี เฝ้าระวังน้ำล้นตลิ่ง อ.กบินทร์บุรี และ อ.ศรีมหาโพธิ',
        date: '28 ก.ย. 2026',
        source: 'กรมป้องกันและบรรเทาสาธารณภัย',
        level: 'warning', // info, warning, danger
        summary: 'ระดับน้ำในแม่น้ำปราจีนบุรีเพิ่มสูงขึ้นต่อเนื่องจากฝนตกหนักสะสมในพื้นที่อุทยานแห่งชาติเขาใหญ่'
      },
      {
        id: 'N02',
        province: 'kanchanaburi',
        title: 'เขื่อนวชิราลงกรณและเขื่อนศรีนครินทร์ ปริมาณน้ำยังรองรับได้เกิน 20%',
        date: '28 ก.ย. 2026',
        source: 'การไฟฟ้าฝ่ายผลิตฯ (กฟผ.)',
        level: 'info',
        summary: 'สภาพความมั่นคงของเขื่อนอยู่ในเกณฑ์ปกติ การระบายน้ำลงสู่ลุ่มน้ำแม่กลองยังคงเป็นไปตามแผน'
      },
      {
        id: 'N03',
        province: 'chonburi',
        title: 'ชลบุรีเตือนมรสุมเข้า ระวังน้ำท่วมขังเส้นทางสายล่างเมืองพัทยาและศรีราชา',
        date: '27 ก.ย. 2026',
        source: 'ศูนย์ควบคุมอุทกภัยเมืองพัทยา',
        level: 'warning',
        summary: 'เตรียมพร้อมเครื่องสูบน้ำประจำสถานีเลียบชายหาดและจุดเสี่ยงถนนสุขุมวิทตลอด 24 ชม.'
      },
      {
        id: 'N04',
        province: 'bkk-east',
        title: 'กทม. เร่งพร่องน้ำคลองประเวศฯ และคลองแสนแสบ รองรับน้ำฝนปลายสัปดาห์',
        date: '28 ก.ย. 2026',
        source: 'สำนักการระบายน้ำ กทม.',
        level: 'info',
        summary: 'เปิดประตูระบายน้ำฝั่งตะวันออกเพื่อเร่งระบายน้ำลงสู่สถานีสูบน้ำพระโขนง'
      }
    ],
    // สถานีตรวจวัดน้ำและเขื่อนสำคัญ
    stations: [
      // === กทม. ตะวันออก ===
      {
        id: 'BKK_E01',
        name: 'คลองแสนแสบ (ประตูระบายน้ำมีนบุรี)',
        zone: 'bkk-east',
        lat: 13.8138,
        lng: 100.7483,
        waterLevel: 0.88,
        bankLevel: 1.20,
        status: 'normal',
        description: 'รับน้ำหลากจากหนองจอกและคลองสิบสาม'
      },
      {
        id: 'BKK_E02',
        name: 'คลองลาดพร้าว (วัดสว่างโสภณ)',
        zone: 'bkk-east',
        lat: 13.8211,
        lng: 100.5982,
        waterLevel: 1.48,
        bankLevel: 1.50,
        status: 'critical',
        description: 'ระดับน้ำใกล้ล้นตลิ่ง เดินเครื่องสูบเต็มกำลัง'
      },

      // === กทม. ตะวันตก ===
      {
        id: 'BKK_W01',
        name: 'คลองทวีวัฒนา (ประตูระบายน้ำทวีวัฒนา)',
        zone: 'bkk-west',
        lat: 13.7854,
        lng: 100.3541,
        waterLevel: 1.85,
        bankLevel: 2.10,
        status: 'warning',
        description: 'เฝ้าระวังน้ำหลากจาก จ.นนทบุรี และนครปฐม'
      },
      {
        id: 'BKK_W02',
        name: 'คลองมหาสวัสดิ์ (ประตูน้ำฉิมพลี)',
        zone: 'bkk-west',
        lat: 13.8012,
        lng: 100.4325,
        waterLevel: 1.62,
        bankLevel: 2.00,
        status: 'normal',
        description: 'ผันน้ำลงสู่แม่น้ำท่าจีน'
      },

      // === กาญจนบุรี (เขื่อนและแม่น้ำแม่กลอง) ===
      {
        id: 'KAN_01',
        name: 'เขื่อนศรีนครินทร์ (อ.ศรีสวัสดิ์)',
        zone: 'kanchanaburi',
        lat: 14.4027,
        lng: 99.1287,
        waterLevel: 78.5, // % ความจุ
        bankLevel: 100.0,
        status: 'normal',
        description: 'ความจุน้ำ 78.5% สามารถรองรับน้ำได้อีกกว่า 3,800 ล้าน ลบ.ม.'
      },
      {
        id: 'KAN_02',
        name: 'แม่น้ำแม่กลอง (สะพานสมเด็จพระสังฆราชฯ อ.เมือง)',
        zone: 'kanchanaburi',
        lat: 14.0228,
        lng: 99.5328,
        waterLevel: 3.40,
        bankLevel: 5.50,
        status: 'normal',
        description: 'การไหลของน้ำปกติ เป็นจุดรวมแม่น้ำแควใหญ่และแควน้อย'
      },

      // === ปราจีนบุรี (จุดน้ำท่วมซ้ำซาก & แม่น้ำปราจีนบุรี) ===
      {
        id: 'PRI_01',
        name: 'แม่น้ำปราจีนบุรี (ตลาดเก่ากบินทร์บุรี)',
        zone: 'prachinburi',
        lat: 13.9922,
        lng: 101.7175,
        waterLevel: 8.85,
        bankLevel: 8.90,
        status: 'critical',
        description: 'จุดวิกฤตลุ่มต่ำ ล้นตลิ่งเข้าชุมชนริมน้ำแล้วบางส่วน'
      },
      {
        id: 'PRI_02',
        name: 'เขื่อนนฤบดินทรจินดา (ห้วยโสมง)',
        zone: 'prachinburi',
        lat: 14.1578,
        lng: 101.8841,
        waterLevel: 82.0, // % ความจุ
        bankLevel: 100.0,
        status: 'warning',
        description: 'ช่วยชะลอน้ำป่าจากอุทยานฯ ทับลานและปางสีดา'
      },

      // === ชลบุรี (อ่างเก็บน้ำ & ระบายน้ำชายฝั่ง) ===
      {
        id: 'CHO_01',
        name: 'อ่างเก็บน้ำบางพระ (อ.ศรีราชา)',
        zone: 'chonburi',
        lat: 13.2144,
        lng: 100.9702,
        waterLevel: 68.2, // % ความจุ
        bankLevel: 100.0,
        status: 'normal',
        description: 'แหล่งน้ำดิบสำคัญของภาคอุตสาหกรรม EEC และระบายน้ำสู่ทะเล'
      },
      {
        id: 'CHO_02',
        name: 'สถานีสูบน้ำพัทยาใต้ (ระบายลงอ่าวไทย)',
        zone: 'chonburi',
        lat: 12.9248,
        lng: 100.8711,
        waterLevel: 1.10,
        bankLevel: 1.80,
        status: 'warning',
        description: 'จุดเสี่ยงน้ำท่วมฉับพลันเมื่อฝนตกหนักเกิน 60 มม./ชม.'
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
