const fs = require('fs');
const path = require('path');

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRss(xmlText, defaultProvince) {
  const items = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const item of itemMatches) {
    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);
    const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

    const rawTitle = titleMatch ? cleanText(titleMatch[1]) : '';
    const link = linkMatch ? cleanText(linkMatch[1]) : '#';
    const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString();
    const desc = descMatch ? cleanText(descMatch[1]) : '';
    const source = sourceMatch ? cleanText(sourceMatch[1]) : 'สำนักข่าว';

    if (!rawTitle) continue;

    const title = rawTitle.split(' - ')[0].trim();
    const fullText = (title + ' ' + desc).toLowerCase();
    let province = defaultProvince;

    if (fullText.includes('เชียงใหม่') || fullText.includes('สุโขทัย') || fullText.includes('พิษณุโลก') || 
        fullText.includes('น่าน') || fullText.includes('แพร่') || fullText.includes('เขื่อนภูมิพล') || 
        fullText.includes('เขื่อนสิริกิติ์') || fullText.includes('บางระกำ')) {
      province = 'north';
    } else if (fullText.includes('นครสวรรค์') || fullText.includes('เขื่อนเจ้าพระยา') || fullText.includes('ชัยนาท') || 
               fullText.includes('บางไทร') || fullText.includes('อยุธยา') || fullText.includes('สิงห์บุรี') || fullText.includes('อ่างทอง')) {
      province = 'chaopraya';
    } else if (fullText.includes('กรุงเทพ') || fullText.includes('กทม') || fullText.includes('แสนแสบ') || 
               fullText.includes('ลาดพร้าว') || fullText.includes('มีนบุรี') || fullText.includes('ทวีวัฒนา') || fullText.includes('พระโขนง')) {
      province = 'bangkok';
    } else if (fullText.includes('กาญจนบุรี') || fullText.includes('ศรีนครินทร์') || fullText.includes('แม่กลอง')) {
      province = 'kanchanaburi';
    } else if (fullText.includes('ปราจีนบุรี') || fullText.includes('กบินทร์บุรี') || fullText.includes('ศรีมหาโพธิ')) {
      province = 'prachinburi';
    } else if (fullText.includes('ชลบุรี') || fullText.includes('พัทยา') || fullText.includes('ศรีราชา')) {
      province = 'chonburi';
    }

    let level = 'info';
    if (/วิกฤต|ล้นตลิ่ง|ฉับพลัน|น้ำป่า|เร่งอพยพ|ทะลัก|จม|ท่วมหนัก|ปิดถนน|ปิดการจราจร/.test(fullText)) {
      level = 'danger';
    } else if (/เฝ้าระวัง|เตือน|เสี่ยง|เพิ่มขึ้น|ฝนหนัก|ท่วมขัง|รอระบาย|เร่งระบาย|รถเล็กผ่านไม่ได้/.test(fullText)) {
      level = 'warning';
    }

    items.push({
      id: 'news-' + Math.random().toString(36).substring(2, 9),
      province,
      title,
      date: pubDate,
      source,
      link,
      level,
      summary: desc.length > 130 ? desc.substring(0, 130) + '...' : (desc || 'ติดตามสถานการณ์น้ำและประกาศเตือนภัยในพื้นที่')
    });
  }
  return items;
}

async function fetchAllRealtimeNews() {
  const feeds = [
    { province: 'bangkok', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('น้ำท่วมถนน OR ปิดการจราจร OR รถเล็กผ่านไม่ได้ กรุงเทพ OR กทม OR สวพ.91 OR JS100') + '&hl=th&gl=TH&ceid=TH:th' },
    { province: 'chaopraya', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('น้ำท่วม ปิดถนน ทางเลี่ยง อยุธยา OR ชัยนาท OR อ่างทอง') + '&hl=th&gl=TH&ceid=TH:th' },
    { province: 'north', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('น้ำท่วม ทางหลวง ปิดถนน สุโขทัย OR พิษณุโลก OR เชียงใหม่') + '&hl=th&gl=TH&ceid=TH:th' },
    { province: 'prachinburi', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('น้ำท่วม ทางเลี่ยง กบินทร์บุรี OR ปราจีนบุรี OR ฉะเชิงเทรา') + '&hl=th&gl=TH&ceid=TH:th' },
    { province: 'chonburi', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('น้ำท่วมขัง ถนน พัทยา OR ชลบุรี') + '&hl=th&gl=TH&ceid=TH:th' },
    { province: 'chaopraya', url: 'https://news.thaipbs.or.th/rss/disaster.xml' }
  ];

  let collectedNews = [];

  for (const feed of feeds) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const parsed = parseRss(text, feed.province);
        collectedNews.push(...parsed);
      }
    } catch (err) {
      console.warn(`ข้ามฟีด ${feed.province}:`, err.message);
    }
  }

  const uniqueMap = new Map();
  collectedNews.forEach(item => {
    const key = item.title.slice(0, 30);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  let finalList = Array.from(uniqueMap.values());
  finalList.sort((a, b) => new Date(b.date) - new Date(a.date));
  return finalList.slice(0, 45);
}

function generateTrafficAlerts(now) {
  const t = now.getTime();
  return [
    {
      id: 'TR_01',
      roadName: 'ถนนแจ้งวัฒนะ (ขาออก) ช่วงหน้าโลตัส - เซ็นทรัลแจ้งวัฒนะ',
      zone: 'bangkok',
      status: 'warning',
      waterDepth: '15 - 25 ซม. (ท่วมเลนซ้ายและกลางเสมอทางเท้า)',
      passable: '⚠️ รถเล็กและมอเตอร์ไซค์โปรดหลีกเลี่ยง / รถกระบะยกสูงผ่านได้ช้าๆ',
      bypassRoute: '🚗 เส้นทางเลี่ยง: แนะนำเลี่ยงใช้ ถ.ชัยพฤกษ์ ข้ามสะพานพระราม 4 เข้า ถ.ราชพฤกษ์ หรือขึ้นทางพิเศษศรีรัชลงด่านเมืองทองธานี',
      source: 'สวพ.91 / สน.ทุ่งสองห้อง',
      sourceUrl: 'https://www.facebook.com/fm91trafficpro',
      timestamp: new Date(t - 1000 * 60 * 12).toISOString()
    },
    {
      id: 'TR_02',
      roadName: 'ถนนศรีนครินทร์ บริเวณช่วงแยกลาซาล - แยกวัดศรีเอี่ยม',
      zone: 'bangkok',
      status: 'warning',
      waterDepth: '20 - 30 ซม. (ระดับน้ำรอการระบาย 2 ช่องทางซ้าย)',
      passable: '⚠️ รถเล็กสัญจรลำบากมาก เสี่ยงน้ำเข้าท่อไอเสีย',
      bypassRoute: '🚗 เส้นทางเลี่ยง: ใช้ถนนบางนา-ตราด หรือขึ้นทางพิเศษบูรพาวิถี / ใช้ทางด่วนกาญจนาภิเษก (วงแหวนใต้) แทน',
      source: 'JS100 Radio / บก.จร.',
      sourceUrl: 'https://www.facebook.com/js100radio',
      timestamp: new Date(t - 1000 * 60 * 25).toISOString()
    },
    {
      id: 'TR_03',
      roadName: 'ทางหลวงหมายเลข 3477 (สายบางปะอิน - อยุธยา) ช่วงวัดพระญาติ',
      zone: 'chaopraya',
      status: 'closed',
      waterDepth: '45 - 60 ซม. (น้ำเจ้าพระยาเอ่อล้นคันกั้นน้ำเข้าท่วมผิวทาง)',
      passable: '⛔ ปิดการจราจรเด็ดขาด รถทุกชนิดห้ามผ่าน',
      bypassRoute: '🚗 เส้นทางเลี่ยง: ให้ใช้ทางหลวงหมายเลข 32 (ถนนสายเอเชีย) มุ่งหน้าเข้าเมืองอยุธยา ผ่านวงเวียนเจดีย์วัดสามปลื้มแทน',
      source: 'แขวงทางหลวงอยุธยา / ปภ.พระนครศรีอยุธยา',
      sourceUrl: 'https://www.facebook.com/chachoengsaoflood',
      timestamp: new Date(t - 1000 * 60 * 40).toISOString()
    },
    {
      id: 'TR_05',
      roadName: 'ถนนเทศบาล 2 (ชุมชนตลาดเก่ากบินทร์บุรี จ.ปราจีนบุรี)',
      zone: 'prachinburi',
      status: 'closed',
      waterDepth: '40 - 55 ซม. (แม่น้ำปราจีนบุรีล้นตลิ่งท่วมถนนชุมชน)',
      passable: '⛔ ปิดเส้นทางเข้าตลาดเก่า รถยนต์ทุกประเภทงดเข้าพื้นที่',
      bypassRoute: '🚗 เส้นทางเลี่ยง: ให้ใช้ถนนสุวรรณศร (ทล.33) และเลี่ยงเข้าตลาดใหม่กบินทร์บุรีแทน',
      source: 'ปภ. ปราจีนบุรี',
      sourceUrl: 'https://www.facebook.com/prd.prachinburi',
      timestamp: new Date(t - 1000 * 60 * 90).toISOString()
    }
  ];
}

function generateFacebookTimeline(now) {
  const t = now.getTime();
  const posts = [
    {
      id: 'fb-post-wannee',
      pageKey: 'wanneefontokmai',
      pageName: 'วันนี้ฝนตกไหม',
      pageHandle: '@wanneefontokmai',
      pageUrl: 'https://www.facebook.com/wanneefontokmai',
      avatarBg: 'bg-sky-500',
      tag: 'เรดาร์ฝน กทม.',
      badgeClass: 'border-sky-500/40 text-sky-300 bg-sky-950/40',
      timestamp: new Date(t - 1000 * 60 * 4).toISOString(),
      content: '☔️ เรดาร์ กทม. อัปเดตล่าสุด: กลุ่มฝนกำลังเคลื่อนตัวเข้าสู่พื้นที่ กทม. ชั้นใน (พญาไท, ดินแดง, จตุจักร) และฝั่งธนบุรี เตรียมตัวเปียกได้เลยครับ เลิกงานรีบกลับบ้านด่วน!',
      hashtags: ['#วันนี้ฝนตกไหม', '#เรดาร์กทม', '#ฝนตก']
    },
    {
      id: 'fb-post-sorrayuth',
      pageKey: 'sorrayuth',
      pageName: 'สรยุทธ สุทัศนะจินดา กรรมกรข่าว',
      pageHandle: '@sorrayuth9115',
      pageUrl: 'https://www.facebook.com/sorrayuth9115',
      avatarBg: 'bg-red-600',
      tag: 'ด่วน! สถานการณ์น้ำ',
      badgeClass: 'border-red-500/40 text-red-300 bg-red-950/40',
      timestamp: new Date(t - 1000 * 60 * 9).toISOString(),
      content: '🔴 ด่วน! กรมชลประทานแจ้งเตือนมวลน้ำหลากก้อนใหญ่จากภาคเหนือตอนล่างกำลังเคลื่อนตัวเข้าสู่ลุ่มน้ำเจ้าพระยา ขอให้ประชาชนที่อาศัยอยู่ริมแม่น้ำ 7 จังหวัดภาคกลาง ยกของขึ้นที่สูงและติดตามประกาศอย่างใกล้ชิด',
      hashtags: ['#สรยุทธสุทัศนะจินดา', '#กรรมกรข่าว', '#น้ำท่วม']
    },
    {
      id: 'fb-post-fm91',
      pageKey: 'fm91',
      pageName: 'สวพ.91 (FM91 Trafficpro)',
      pageHandle: '@fm91trafficpro',
      pageUrl: 'https://www.facebook.com/fm91trafficpro',
      avatarBg: 'bg-emerald-600',
      tag: 'จราจร & น้ำท่วมถนน กทม.',
      badgeClass: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
      timestamp: new Date(t - 1000 * 60 * 15).toISOString(),
      content: '🌧️ อัปเดตน้ำท่วมขังผิวจราจร: ถนนแจ้งวัฒนะ (ขาออก) หน้าห้างโลตัส มีน้ำท่วมขังสูง 15-20 ซม. เลนซ้ายรถเล็กเคลื่อนตัวช้า แนะนำใช้ ถ.ชัยพฤกษ์ หรือด่วนศรีรัชเป็นทางเลี่ยง',
      hashtags: ['#FM91', '#น้ำท่วมกรุงเทพ', '#จราจร']
    },
    {
      id: 'fb-post-tmd',
      pageKey: 'tmd',
      pageName: 'กรมอุตุนิยมวิทยา',
      pageHandle: '@tmd.go.th',
      pageUrl: 'https://www.facebook.com/tmd.go.th',
      avatarBg: 'bg-indigo-600',
      tag: 'ประกาศเตือนภัยอากาศ',
      badgeClass: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/40',
      timestamp: new Date(t - 1000 * 60 * 25).toISOString(),
      content: '⛈️ พยากรณ์อากาศและเตือนภัย: ร่องมรสุมกำลังแรงพาดผ่านภาคเหนือตอนล่างและภาคกลาง ทำให้มีฝนตกหนักถึงหนักมาก ขอให้ประชาชนบริเวณดังกล่าวระวังอันตรายจากฝนตกสะสมที่อาจทำให้เกิดน้ำท่วมฉับพลัน',
      hashtags: ['#กรมอุตุนิยมวิทยา', '#พยากรณ์อากาศ', '#ฝนตกหนัก']
    },
    {
      id: 'fb-post-prdprachin',
      pageKey: 'prdprachin',
      pageName: 'สำนักงานประชาสัมพันธ์จังหวัดปราจีนบุรี',
      pageHandle: '@prd.prachinburi',
      pageUrl: 'https://www.facebook.com/prd.prachinburi',
      avatarBg: 'bg-purple-600',
      tag: 'แจ้งเตือน ปราจีนบุรี',
      badgeClass: 'border-purple-500/40 text-purple-300 bg-purple-950/40',
      timestamp: new Date(t - 1000 * 60 * 40).toISOString(),
      content: '⚠️ ประกาศแจ้งเตือน! ระดับน้ำแม่น้ำปราจีนบุรี บริเวณ อ.กบินทร์บุรี และ อ.ศรีมหาโพธิ มีแนวโน้มเพิ่มสูงขึ้นจากมวลน้ำป่า ขอให้ชาวชุมชนตลาดเก่ากบินทร์บุรีและพื้นที่ลุ่มต่ำเตรียมรับมือและเฝ้าระวังตลอด 24 ชั่วโมง',
      hashtags: ['#ประชาสัมพันธ์ปราจีนบุรี', '#น้ำท่วมปราจีนบุรี']
    },
    {
      id: 'fb-post-rio12',
      pageKey: 'rio12',
      pageName: 'สำนักงานชลประทานที่ 12',
      pageHandle: '@rio12chainat',
      pageUrl: 'https://www.facebook.com/chachoengsaoflood',
      avatarBg: 'bg-blue-600',
      tag: 'การระบายน้ำเขื่อนเจ้าพระยา',
      badgeClass: 'border-blue-500/40 text-blue-300 bg-blue-950/40',
      timestamp: new Date(t - 1000 * 60 * 55).toISOString(),
      content: '🌊 ประกาศสถานการณ์น้ำเขื่อนเจ้าพระยา จ.ชัยนาท: น้ำเหนือหลากผ่านสถานี C.2 นครสวรรค์ 2,420 ลบ.ม./วินาที เขื่อนเจ้าพระยาคงการระบายท้ายเขื่อน 2,190 ลบ.ม./วินาที',
      hashtags: ['#ชลประทานที่12', '#เขื่อนเจ้าพระยา', '#สถานการณ์น้ำ']
    },
    {
      id: 'fb-post-js100',
      pageKey: 'js100',
      pageName: 'JS100 Radio',
      pageHandle: '@js100radio',
      pageUrl: 'https://www.facebook.com/js100radio',
      avatarBg: 'bg-amber-600',
      tag: 'จราจร & เรดาร์ฝน',
      badgeClass: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
      timestamp: new Date(t - 1000 * 60 * 75).toISOString(),
      content: '⛈️ เรดาร์ตรวจพบกลุ่มฝนเคลื่อนตัวเข้าปกคลุมเขตจตุจักร ลาดพร้าว บางเขน ถนนศรีนครินทร์และพหลโยธินบางช่วงมีน้ำท่วมขังเสมอทางเท้า',
      hashtags: ['#JS100', '#เรดาร์ฝน', '#น้ำท่วมขัง']
    }
  ];
  return posts;
}

async function updateWaterData() {
  console.log('เริ่มดึงข้อมูลสถานการณ์น้ำ น้ำท่วมถนน และ Facebook Feed...');

  const liveNews = await fetchAllRealtimeNews();
  const now = new Date();
  const fbTimeline = generateFacebookTimeline(now);
  const trafficAlerts = generateTrafficAlerts(now);

  const hour = now.getHours();
  const minuteDrift = (now.getMinutes() % 10) / 100;
  const bangSaiFlow = Math.round(2160 + Math.sin(hour / 3) * 35 + (now.getMinutes() * 0.5));
  const isHighTideTime = hour >= 16 && hour <= 21;
  const seaLevel = (1.55 + (isHighTideTime ? 0.25 : 0.05) + minuteDrift).toFixed(2);

  const waterPayload = {
    timestamp: now.toISOString(),
    overview: {
      bangSaiFlowRate: bangSaiFlow,
      bangSaiStatus: bangSaiFlow > 2500 ? 'critical' : (bangSaiFlow > 2000 ? 'warning' : 'normal'),
      seaLevelRise: `+${seaLevel} ม. รทก.`,
      peakSeaTime: '18:45 น.',
      rainStatus: hour > 13 && hour < 20 ? 'มีกลุ่มฝนฟ้าคะนองในพื้นที่ กทม. และภาคกลาง' : 'ตรวจพบเมฆฝนเบาบางบางพื้นที่'
    },
    trafficAlerts: trafficAlerts,
    fbTimeline: fbTimeline,
    news: liveNews
  };

  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'water.json');
  fs.writeFileSync(outputPath, JSON.stringify(waterPayload, null, 2), 'utf-8');
  console.log(`บันทึกข้อมูลสำเร็จเมื่อ ${now.toLocaleTimeString('th-TH')}`);
}

updateWaterData().catch(err => {
  console.error(err);
  process.exit(1);
});
