// 将 react-icons 光栅化为 PNG dataURI，供幻灯片使用。带缓存。
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const Fa = require('react-icons/fa');
const Gi = require('react-icons/gi');
const Md = require('react-icons/md');
const Bs = require('react-icons/bs');

const SETS = { Fa, Gi, Md, Bs };
const cache = new Map();

// 课程语义 -> 图标
const MAP = {
  scale:     ['Gi', 'GiScales'],        // 公正 / 天平
  gavel:     ['Fa', 'FaGavel'],         // 审判 / 法官
  balance:   ['Fa', 'FaBalanceScale'],  // 衡平
  book:      ['Fa', 'FaBook'],          // 法典 / 教材
  law:       ['Gi', 'GiInjustice'],
  shield:    ['Fa', 'FaShieldAlt'],     // 保密 / 保障
  lock:      ['Fa', 'FaLock'],          // 保密
  users:     ['Fa', 'FaUsers'],         // 共同体
  user:      ['Fa', 'FaUserTie'],       // 律师 / 职业人
  handshake: ['Fa', 'FaHandshake'],     // 委托关系
  conflict:  ['Gi', 'GiCrossedSwords'], // 利益冲突
  money:     ['Fa', 'FaCoins'],         // 收费
  bank:      ['Fa', 'FaUniversity'],    // 法院 / 机关
  search:    ['Fa', 'FaSearch'],        // 检察 / 监督
  eye:       ['Fa', 'FaEye'],           // 监督
  warn:      ['Fa', 'FaExclamationTriangle'],
  check:     ['Fa', 'FaCheckCircle'],
  times:     ['Fa', 'FaTimesCircle'],
  quote:     ['Fa', 'FaQuoteLeft'],
  clock:     ['Fa', 'FaClock'],
  file:      ['Fa', 'FaFileContract'],  // 文书 / 合同
  stamp:     ['Fa', 'FaStamp'],         // 公证
  brain:     ['Fa', 'FaBrain'],         // 伦理判断
  compass:   ['Fa', 'FaCompass'],       // 价值指引
  globe:     ['Fa', 'FaGlobeAsia'],     // 域外 / 涉外
  heart:     ['Fa', 'FaHeart'],         // 为民
  flag:      ['Fa', 'FaFlag'],          // 忠诚
  hammer:    ['Fa', 'FaHammer'],        // 惩戒
  road:      ['Fa', 'FaRoad'],          // 程序 / 路径
  sitemap:   ['Fa', 'FaSitemap'],       // 体系
  comments:  ['Fa', 'FaComments'],      // 研讨
  lightbulb: ['Fa', 'FaLightbulb'],     // 要点
  graduate:  ['Fa', 'FaUserGraduate'],  // 学生 / 教学
  robot:     ['Fa', 'FaRobot'],         // 人工智能
  landmark:  ['Fa', 'FaLandmark'],
  list:      ['Fa', 'FaListOl'],
  building:  ['Fa', 'FaBuilding'],      // 律所
  briefcase: ['Fa', 'FaBriefcase'],
  megaphone: ['Fa', 'FaBullhorn'],      // 业务推广 / 媒体
  ban:       ['Fa', 'FaBan'],
  key:       ['Fa', 'FaKey'],
  seedling:  ['Fa', 'FaSeedling'],
  history:   ['Fa', 'FaHistory'],
  question:  ['Fa', 'FaQuestion'],
};

async function icon(name, hex = 'FFFFFF', px = 256) {
  const key = `${name}|${hex}|${px}`;
  if (cache.has(key)) return cache.get(key);
  const spec = MAP[name] || MAP.check;
  const Comp = SETS[spec[0]][spec[1]];
  if (!Comp) throw new Error('unknown icon ' + name);
  let svg = RDS.renderToStaticMarkup(
    React.createElement(Comp, { color: '#' + hex, size: px })
  );
  if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const buf = await sharp(Buffer.from(svg)).resize(px, px, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
  }).png().toBuffer();
  const uri = 'image/png;base64,' + buf.toString('base64');
  cache.set(key, uri);
  return uri;
}

// 预热：一次性渲染所有会用到的组合
async function warm(names, colors, px = 256) {
  for (const n of names) for (const c of colors) await icon(n, c, px);
}

module.exports = { icon, warm, MAP };
