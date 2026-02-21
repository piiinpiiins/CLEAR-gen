// ============================================================
// CLEAR-gen — Multi-Signal Detection Engine
// 多信號加權偵測引擎
// ============================================================

const DETECTOR_LOG = '[CLEAR-gen/detector]';

// ============================================================
// SECTION A: DETECTION CATEGORIES & LABELS
// ============================================================

const DETECTION_CATEGORIES = {
    SIMPLIFIED_CHINESE: 'simplified_chinese',
    CONTENT_FARM: 'content_farm',
    AI_FAKE_KNOWLEDGE: 'ai_fake_knowledge',
    CHINA_PROPAGANDA: 'china_propaganda',
    CHINA_ORIGIN: 'china_origin',
    AI_GENERATED: 'ai_generated',
};

const CATEGORY_LABELS = {
    simplified_chinese: '簡體字內容',
    content_farm: '內容農場',
    ai_fake_knowledge: 'AI 假知識',
    china_propaganda: '對台認知作戰',
    china_origin: '中國來源頻道',
    ai_generated: 'AI 生成影片',
};

const SEVERITY = { RED: 'red', YELLOW: 'yellow', GREEN: 'green', PURPLE: 'purple' };

// ============================================================
// SECTION B: ORIGINAL PATTERNS (migrated from content.js)
// ============================================================

// --- Content Farm Patterns ---
const CONTENT_FARM_PATTERNS = [
    /震惊.{0,5}[!！]/, /竟然.{0,10}[!！]/, /没想到/,
    /太[可厉恐吓]怕了/, /不敢相信/, /真相.*曝光/,
    /内幕.*揭[秘露开]/, /99%.{0,5}人.{0,5}不知道/,
    /看完.*[惊吓傻哭笑]了/, /千万.{0,5}[别不要]/,
    /赶紧.{0,5}[看删收藏转发]/, /速[看转删]/, /必看/, /一定要看/,
    /\d+个.{0,5}[秘密真相原因方法技巧]/, /盘点.{0,5}\d+/, /top\s*\d+/i,
    /[专專]家[称說说警告透露]/, /[科科]学家[发發][现現]/,
    /央视[曝报爆]/, /[官权]方[确證证]认/,
    /你还不知道吧/, /原来如此/, /终于.{0,5}[真相答案]/,
    /难怪/, /怪不得/, /细思极恐/, /太疯狂了/,
];
const CONTENT_FARM_CHANNEL_PATTERNS = [
    /大陆.{0,4}[新热]/, /中[国國].{0,4}[最第一]/, /环球.{0,4}[热观]/,
    /[头头]条/, /说天下/, /看中[国國]/, /[热熱]点/,
    /百科.{0,4}[全大]/, /奇闻/, /解密/, /揭秘/, /探索发现/,
];

// --- AI Fake Knowledge Patterns ---
const AI_FAKE_KNOWLEDGE_PATTERNS = [
    /\d+个冷知识/, /冷知识.{0,5}合集/, /涨知识/, /长知识/,
    /科普.{0,5}[一二三四五六七八九十\d]/,
    /AI.{0,5}[讲说解读]/, /人工智[慧能]/,
    /[医醫]生[都再也不].*[说說告诉]/,
    /这[种个样].{0,5}[食物水果蔬菜].*[治疗癌症]/,
    /[惊驚]人[的发發][现現]/, /[药藥]厂.{0,5}不想.*知道/,
    /真相被隐瞒/, /被封[锁禁杀]/, /不让你知道/,
    /[隐隱]藏的[真秘]/, /量子.{0,10}[治养健身心灵]/,
    /外星[人文明]/, /[预預]言.*[实實][现現]/,
];

// --- Propaganda Patterns ---
const PROPAGANDA_PATTERNS = [
    /统一.*台[湾灣]/, /台[湾灣].*回归/, /台[湾灣].*祖国/,
    /祖国.*统一/, /一[个個]中[国國]/, /两岸.*统一/,
    /[解武]放台[湾灣]/, /收[复復]台[湾灣]/,
    /[解放军軍].*台[湾灣]/, /攻台/, /武统/,
    /登[陆陸].*台[湾灣]/, /东风.*台[湾灣]/,
    /[航母舰艇].*台海/, /台海.*[战戰][争爭]/,
    /台独.*分裂/, /台[湾灣].*[省省份地区]/,
    /[蔡赖].*[卖卖国贼]/, /民进党.*[骗骗子]/, /绿[营媒].*[骗造谣]/,
    /中[国國].*崛起.*[美日台]/, /[美日].*[害怕恐惧慌].*中[国國]/,
    /[美日].*衰[落退败]/, /中[国國].*[碾压超越吊打秒杀]/,
    /厉害了.*我的国/,
    /[美日].*[霸权亡我之心]/, /[帝国主义殖民].*[美日西方]/,
    /西方.*[阴谋打压遏制围堵]/, /中[国國]人.*[站起来不答应]/,
];

// --- China-Origin Indicators ---
const CHINA_ORIGIN_INDICATORS = [
    /bilibili/i, /b站/, /抖音/, /douyin/i, /tiktok.*中[国國]/i,
    /小红书/, /微博/, /weibo/i, /快手/, /西瓜视频/,
    /百度/, /爱奇艺/, /优酷/, /腾讯/, /哔哩哔哩/,
    /央[视視][频頻道]/, /CCTV/i, /CGTN/i,
    /新华[社网網]/, /人民[日网網]/, /环球时报/, /观察者网/, /参考消息/,
];
const CHINA_TERMINOLOGY = [
    /视频/, /信息/, /软件/, /硬件/, /网络/, /服务器/,
    /数据/, /智能/, /激光/, /优化/, /打印/, /鼠标/,
    /内存/, /芯片/, /程序/,
];

// --- Red-Label Channel Blacklist ---
// 紅標頻道名單：比對到頻道名稱直接判定為 china_propaganda (紅色)
const CHANNEL_BLACKLIST = [
    /郭正亮/,
    /中天/,
    /TVBS/i,
    /少康/,
    /人民報/,  /renminbao/i,
    /少唐戰情室/,
    /更新台灣/,
    /新聞大白話/,
    /寰宇/,
    /大新聞大爆卦/,
];

// ============================================================
// SECTION C: SIMPLIFIED CHINESE DETECTION
// ============================================================

const SIMPLIFIED_ONLY_CHARS = new Set([
    '与', '专', '业', '东', '个', '丰', '临', '为', '丽',
    '举', '义', '乐', '习', '乡', '书', '买', '乱', '争',
    '亏', '云', '亚', '产', '亩', '亲', '亿', '仅', '从',
    '仓', '仪', '们', '价', '众', '优', '伙', '会', '伟',
    '传', '伤', '伦', '估', '体', '佣', '余', '佛', '侠',
    '侣', '侦', '侧', '侨', '俩', '债', '倾', '假', '偿',
    '储', '儿', '兑', '党', '兰', '关', '兴', '兹', '养',
    '内', '冈', '冲', '决', '况', '净', '准', '凉', '减',
    '凤', '凭', '几', '凯', '击', '创', '划', '则', '刘',
    '刚', '剂', '剧', '劝', '办', '务', '动', '劳', '势',
    '勋', '匀', '区', '医', '华', '协', '单', '卖', '卫',
    '却', '厂', '厅', '历', '厉', '压', '厌', '县', '叁',
    '参', '双', '发', '变', '叙', '叶', '号', '叹', '听',
    '启', '呐', '呜', '员', '呢', '周', '咏', '响', '哑',
    '唤', '啬', '啸', '喷', '嘘', '团', '园', '围', '图',
    '国', '圆', '圣', '场', '坏', '块', '坚', '坛', '坝',
    '垒', '垦', '垫', '报', '壮', '声', '壳', '处', '备',
    '复', '够', '头', '夸', '夹', '夺', '奋', '奖', '奥',
    '妆', '妇', '妈', '姗', '姜', '娄', '娱', '婴', '嫔',
    '学', '宁', '宝', '实', '宠', '审', '宪', '宫', '宽',
    '宾', '寝', '对', '寻', '导', '寿', '将', '尔', '尘',
    '尝', '尧', '层', '属', '岁', '岂', '岗', '岭', '岳',
    '岸', '币', '师', '帅', '帐', '帜', '带', '帮', '幂',
    '广', '庄', '庆', '庐', '庙', '废', '应', '开', '异',
    '弃', '张', '弥', '弯', '强', '归', '当', '录', '彝',
    '彦', '彻', '径', '忆', '态', '怀', '怜', '总', '恳',
    '恶', '悦', '悬', '惊', '惧', '惨', '惩', '愤', '慑',
    '忧', '戏', '战', '户', '执', '扑', '扔', '扩', '扫',
    '扬', '扰', '抚', '抛', '抢', '护', '报', '担', '拟',
    '拥', '择', '挂', '挡', '挣', '挤', '挥', '损', '换',
    '据', '捣', '授', '掷', '搁', '搅', '携', '摄', '摆',
    '摇', '撑', '撤', '操', '擞', '攒', '敌', '数', '斋',
    '斗', '斩', '断', '无', '旧', '时', '旷', '昆', '显',
    '晋', '晒', '晓', '晕', '暂', '术', '机', '杀', '杂',
    '权', '条', '来', '杨', '极', '构', '枪', '柜', '栅',
    '标', '栈', '栋', '栏', '树', '样', '桥', '桩', '梦',
    '检', '棂', '楼', '榄', '槛', '横', '橱', '欢', '欧',
    '歼', '残', '殴', '毁', '毕', '毙', '气', '氢', '汇',
    '汉', '污', '汤', '沟', '没', '沧', '沪', '沿', '泪',
    '泼', '泽', '洁', '洒', '浅', '浆', '浇', '浊', '济',
    '浏', '浑', '浓', '涛', '涝', '涡', '润', '涩', '淀',
    '渊', '渐', '渔', '温', '游', '湾', '溃', '满', '滞',
    '滤', '滥', '滨', '灭', '灯', '灵', '灾', '灿', '炉',
    '炜', '炼', '烁', '烂', '烃', '烛', '烟', '烦', '烧',
    '热', '焕', '焰', '煮', '爱', '爷', '牍', '牵', '犊',
    '犹', '狈', '狮', '独', '狭', '猎', '猪', '献', '猴',
    '玑', '环', '现', '珐', '珑', '珲', '琐', '瑶', '璃',
    '瓮', '电', '画', '畅', '畴', '疗', '疯', '症', '痒',
    '痴', '瘪', '瘫', '盏', '盐', '监', '盖', '盗', '盘',
    '眍', '着', '睁', '瞒', '矫', '矿', '码', '砖', '础',
    '硕', '确', '碍', '碛', '礼', '祝', '祯', '祸', '禀',
    '禄', '离', '种', '积', '称', '稳', '穷', '窃', '窍',
    '窜', '窝', '窥', '竞', '笔', '笼', '筑', '筝', '签',
    '简', '箩', '篓', '篮', '类', '粮', '粪', '纠', '红',
    '纤', '约', '级', '纪', '纫', '纬', '纯', '纱', '纲',
    '纳', '纵', '纷', '纸', '纹', '纺', '纽', '线', '练',
    '组', '细', '终', '绍', '经', '绑', '结', '绕', '绘',
    '给', '络', '绝', '绞', '统', '继', '绩', '绪', '续',
    '绳', '维', '绵', '综', '绿', '缀', '缅', '缆', '缉',
    '缎', '缓', '缔', '编', '缘', '缚', '缝', '缠', '缤',
    '缩', '缭', '缴', '罗', '罢', '罚', '罩', '翘', '耕',
    '职', '联', '聋', '肃', '肠', '肤', '肾', '胀', '胁',
    '胆', '脉', '脏', '脐', '脑', '脓', '脚', '脱', '腊',
    '腻', '腾', '膑', '臭', '舆', '舍', '舰', '艰', '艳',
    '节', '芦', '芜', '苍', '苏', '苹', '茎', '荆', '荐',
    '荡', '荣', '荤', '药', '莅', '莱', '莲', '获', '营',
    '萤', '萧', '蒂', '蒋', '蓝', '蔑', '蔷', '薪', '虏',
    '虑', '虚', '虫', '蚁', '蚂', '蛊', '蛎', '蛏', '蝇',
    '蝉', '蝎', '蝴', '蝶', '衅', '补', '衬', '袄', '袜',
    '装', '裤', '褛', '览', '觉', '观', '规', '觅', '视',
    '觊', '觎', '览', '订', '认', '讨', '让', '训', '议',
    '讯', '记', '讲', '讳', '讶', '许', '论', '讼', '设',
    '访', '证', '评', '识', '诈', '诉', '词', '译', '试',
    '诗', '诚', '话', '诞', '询', '详', '语', '误', '说',
    '请', '诸', '诺', '读', '课', '谁', '调', '谅', '谈',
    '谊', '谋', '谍', '谎', '谐', '谓', '谢', '谣', '谦',
    '谨', '谱', '谴', '豪', '贝', '贞', '负', '贡', '财',
    '责', '贤', '败', '货', '质', '贩', '贪', '贫', '购',
    '贮', '贯', '贰', '贱', '贴', '贵', '贷', '贸', '费',
    '贺', '贼', '赁', '资', '赈', '赊', '赋', '赌', '赎',
    '赏', '赐', '赔', '赖', '赘', '赚', '赛', '赞', '赠',
    '赵', '趋', '跃', '跄', '践', '跷', '踊', '踌', '踪',
    '蹑', '蹿', '车', '轧', '轨', '轩', '转', '轮', '软',
    '轰', '轻', '载', '较', '辅', '辆', '辈', '辉', '辑',
    '输', '辙', '辞', '辟', '辩', '边', '辽', '达', '迁',
    '过', '迈', '运', '还', '这', '进', '远', '违', '连',
    '迟', '迹', '适', '选', '逊', '递', '逻', '遗', '邓',
    '邝', '邬', '邮', '邻', '郁', '郑', '鉴', '钉', '钊',
    '钍', '钎', '钏', '钐', '钒', '钓', '钗', '钙', '钛',
    '钝', '钞', '钟', '钠', '钢', '钣', '钤', '钥', '钦',
    '钧', '钨', '钩', '钮', '钯', '钰', '钱', '钳', '钴',
    '钵', '钺', '钻', '铀', '铁', '铂', '铃', '铄', '铅',
    '铆', '铉', '铊', '铋', '铌', '铍', '铎', '铐', '铑',
    '铒', '铕', '铖', '铗', '铙', '铛', '铜', '铝', '铞',
    '铟', '铠', '铡', '铢', '铣', '铤', '铥', '铧', '铨',
    '铩', '铪', '铫', '铬', '铭', '铮', '铯', '铰', '铱',
    '铲', '铳', '银', '铵', '铷', '铸', '铺', '铼', '链',
    '铿', '销', '锁', '锂', '锃', '锄', '锅', '锆', '锇',
    '锈', '锉', '锊', '锋', '锌', '锐', '锑', '锒', '锓',
    '锔', '锕', '错', '锚', '锡', '锢', '锣', '锤', '锥',
    '锦', '锨', '锩', '锫', '锬', '锭', '键', '锯', '锰',
    '锱', '锲', '锳', '锴', '锵', '锶', '锷', '锸', '锹',
    '锺', '锻', '锾', '锿', '镀', '镁', '镂', '镃', '镅',
    '镆', '镇', '镈', '镉', '镊', '镋', '镌', '镍', '镎',
    '镏', '镐', '镑', '镒', '镓', '镔', '镕', '镖', '镗',
    '镘', '镙', '镛', '镜', '镝', '镞', '镟', '镡', '镢',
    '镣', '镤', '镥', '镦', '镧', '镨', '镩', '镪', '镫',
    '镬', '镭', '镯', '镰', '镱', '镲', '镳', '镶', '长',
    '门', '闪', '闭', '问', '闯', '闰', '闲', '间', '闷',
    '闸', '闹', '闻', '闽', '闾', '阀', '阁', '阂', '阃',
    '阅', '阆', '阇', '阈', '阉', '阊', '阋', '阌', '阍',
    '阎', '阏', '阐', '阑', '阒', '阓', '阔', '阕', '阖',
    '阗', '阘', '阙', '阚', '队', '阳', '阴', '阵', '阶',
    '际', '陆', '陇', '陈', '陉', '陕', '陧', '险', '随',
    '隐', '隶', '隽', '难', '雏', '雳', '雾', '霁', '霉',
    '霭', '靓', '静', '面', '鞑', '韦', '韧', '韩', '韫',
    '页', '顶', '顷', '项', '顺', '须', '顼', '顽', '顾',
    '顿', '颁', '颂', '预', '颅', '领', '颇', '颈', '颉',
    '颊', '颌', '颍', '颎', '颏', '颐', '频', '颓', '颔',
    '颖', '颗', '题', '颚', '颛', '颜', '额', '颞', '颟',
    '颠', '颡', '颢', '颤', '颥', '颦', '颧', '风', '飒',
    '飓', '飘', '飙', '飞', '饥', '饧', '饨', '饩', '饪',
    '饫', '饬', '饭', '饮', '饯', '饰', '饱', '饲', '饳',
    '饴', '饵', '饶', '饷', '饸', '饹', '饺', '饻', '饼',
    '饽', '饾', '饿', '馀', '馁', '馂', '馃', '馄', '馅',
    '馆', '馇', '馈', '馉', '馊', '馋', '馌', '馍', '馎',
    '馏', '馐', '馑', '馒', '馓', '馔', '馕', '马', '驭',
    '驮', '驯', '驰', '驱', '驲', '驳', '驴', '驵', '驶',
    '驷', '驸', '驹', '驺', '驻', '驼', '驽', '驾', '驿',
    '骀', '骁', '骂', '骃', '骄', '骅', '骆', '骇', '骈',
    '骉', '骊', '骋', '验', '骍', '骎', '骏', '骐', '骑',
    '骒', '骓', '骔', '骕', '骖', '骗', '骘', '骙', '骚',
    '骛', '骜', '骝', '骞', '骟', '骠', '骡', '骢', '骣',
    '骤', '骥', '骦', '骧', '骨', '髅', '鬓', '魇', '魉',
    '鱼', '鱿', '鲁', '鲂', '鲅', '鲆', '鲇', '鲈', '鲋',
    '鲍', '鲎', '鲐', '鲑', '鲒', '鲔', '鲕', '鲗', '鲘',
    '鲙', '鲛', '鲜', '鲞', '鲟', '鲠', '鲡', '鲢', '鲣',
    '鲤', '鲥', '鲦', '鲧', '鲨', '鲩', '鲫', '鲭', '鲮',
    '鲰', '鲱', '鲲', '鲳', '鲴', '鲵', '鲶', '鲷', '鲸',
    '鲺', '鲻', '鲼', '鲽', '鲾', '鳀', '鳃', '鳄', '鳅',
    '鳇', '鳊', '鳋', '鳌', '鳍', '鳎', '鳏', '鳐', '鳓',
    '鳔', '鳕', '鳖', '鳗', '鳘', '鳙', '鳜', '鳝', '鳞',
    '鳟', '鳠', '鳡', '鳢', '鸟', '鸠', '鸡', '鸢', '鸣',
    '鸥', '鸦', '鸨', '鸩', '鸪', '鸫', '鸬', '鸭', '鸮',
    '鸯', '鸰', '鸱', '鸲', '鸳', '鸵', '鸶', '鸷', '鸸',
    '鸹', '鸺', '鸻', '鸼', '鸽', '鸾', '鸿', '鹀', '鹁',
    '鹂', '鹃', '鹄', '鹅', '鹆', '鹇', '鹈', '鹉', '鹊',
    '鹋', '鹌', '鹎', '鹏', '鹑', '鹕', '鹗', '鹘', '鹚',
    '鹛', '鹜', '鹞', '鹣', '鹤', '鹦', '鹧', '鹨', '鹩',
    '鹪', '鹫', '鹬', '鹭', '鹰', '鹳', '鹿', '麦', '麸',
    '黄', '黉', '黑', '黩', '黪', '黾', '鼋', '鼍', '鼹',
    '齐', '齿', '龄', '龅', '龆', '龇', '龈', '龉', '龊',
    '龋', '龌', '龙', '龚', '龛', '龟',
]);

function isCJKChar(char) {
    const code = char.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) || (code >= 0xF900 && code <= 0xFAFF);
}

function detectSimplifiedChinese(text) {
    if (!text) return { isSimplified: false, confidence: 0, simplifiedCount: 0 };
    let simplifiedCount = 0, totalCJK = 0;
    for (const char of text) {
        if (isCJKChar(char)) {
            totalCJK++;
            if (SIMPLIFIED_ONLY_CHARS.has(char)) simplifiedCount++;
        }
    }
    if (totalCJK === 0) return { isSimplified: false, confidence: 0, simplifiedCount: 0 };
    return {
        isSimplified: simplifiedCount >= 1,
        confidence: Math.min((simplifiedCount / totalCJK) * 5, 1),
        simplifiedCount,
    };
}

// ============================================================
// SECTION D: SIGNAL EXTRACTORS
// ============================================================

/**
 * Extract title-based signals from a video title.
 */
function extractTitleSignals(title) {
    if (!title) return { length: 0, exclCount: 0, questCount: 0, emojiCount: 0, hasNumbers: false };

    const exclCount = (title.match(/[!！]{1,}/g) || []).length;
    const questCount = (title.match(/[?？]{1,}/g) || []).length;
    const emojiCount = (title.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    const hasNumbers = /\d+[个個件种種招步条條]/.test(title);
    const hasAllCaps = /[A-Z]{3,}/.test(title);
    const ellipsisCount = (title.match(/[…\.]{3,}|\.{3,}/g) || []).length;

    return {
        length: title.length,
        exclCount,
        questCount,
        emojiCount,
        hasNumbers,
        hasAllCaps,
        ellipsisCount,
        // Punctuation density — high density = clickbait signal
        punctuationDensity: title.length > 0 ? (exclCount + questCount + ellipsisCount) / title.length : 0,
    };
}

/**
 * Extract metadata signals from a video card DOM element.
 * Extracts view count, upload time, video duration from the card.
 */
function extractMetadataSignals(card) {
    if (!card) return null;

    const metadata = {
        viewCount: null,
        uploadTime: null,
        duration: null,
        isRecent: false,
        hasHighViews: false,
    };

    // Try to extract view count from metadata line
    const metadataEl = card.querySelector(
        '#metadata-line span, ytd-video-meta-block span, ' +
        '.inline-metadata-item, yt-formatted-string.style-scope.ytd-video-meta-block'
    );
    if (metadataEl) {
        const text = metadataEl.textContent || '';
        // Parse view counts like "1.2万次观看" or "123K views" or "1,234 views"
        const viewMatch = text.match(/([0-9,.]+)\s*([万萬kKmM百千億亿]?)\s*[次观觀看views]/i);
        if (viewMatch) {
            let count = parseFloat(viewMatch[1].replace(/,/g, ''));
            const unit = viewMatch[2];
            if (unit === '万' || unit === '萬') count *= 10000;
            else if (unit === 'k' || unit === 'K' || unit === '千') count *= 1000;
            else if (unit === 'm' || unit === 'M' || unit === '百' + '万') count *= 1000000;
            else if (unit === '億' || unit === '亿') count *= 100000000;
            metadata.viewCount = count;
            metadata.hasHighViews = count > 1000000;
        }
    }

    // Try to extract upload time
    const allMetaSpans = card.querySelectorAll(
        '#metadata-line span, .inline-metadata-item, ' +
        'ytd-video-meta-block span'
    );
    for (const span of allMetaSpans) {
        const text = span.textContent || '';
        // "3 hours ago", "2天前", "1 day ago"
        if (/\d+\s*(小时|小時|hours?|分钟|分鐘|minutes?)\s*(前|ago)/i.test(text)) {
            metadata.isRecent = true;
            metadata.uploadTime = text.trim();
        } else if (/\d+\s*(天|days?)\s*(前|ago)/i.test(text)) {
            const dayMatch = text.match(/(\d+)/);
            if (dayMatch && parseInt(dayMatch[1]) <= 1) metadata.isRecent = true;
            metadata.uploadTime = text.trim();
        }
    }

    // Try to extract video duration from thumbnail overlay
    const durationEl = card.querySelector(
        'ytd-thumbnail-overlay-time-status-renderer span, ' +
        'badge-shape .badge-shape-wiz__text, ' +
        '#overlays span[aria-label]'
    );
    if (durationEl) {
        const durText = (durationEl.textContent || '').trim();
        // Parse "12:34" or "1:23:45"
        const parts = durText.split(':').map(Number);
        if (parts.length === 2) metadata.duration = parts[0] * 60 + parts[1];
        else if (parts.length === 3) metadata.duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return metadata;
}

// ============================================================
// SECTION E: CATEGORY DETECTORS
// ============================================================

function detectContentFarm(title, channelName) {
    const matchedPatterns = [];
    let score = 0;
    for (const p of CONTENT_FARM_PATTERNS) {
        if (p.test(title)) { matchedPatterns.push(p.source); score += 0.3; }
    }
    for (const p of CONTENT_FARM_CHANNEL_PATTERNS) {
        if (p.test(channelName || '')) { matchedPatterns.push(`ch:${p.source}`); score += 0.4; }
    }
    const exclCount = (title.match(/[!！]{2,}/g) || []).length;
    const questCount = (title.match(/[?？]{2,}/g) || []).length;
    if (exclCount + questCount >= 2) { matchedPatterns.push('excessive_punctuation'); score += 0.2; }
    return { isContentFarm: score >= 0.3, confidence: Math.min(score, 1), matchedPatterns };
}

function detectAIFakeKnowledge(title) {
    const matchedPatterns = [];
    let score = 0;
    for (const p of AI_FAKE_KNOWLEDGE_PATTERNS) {
        if (p.test(title)) { matchedPatterns.push(p.source); score += 0.35; }
    }
    return { isAIFake: score >= 0.35, confidence: Math.min(score, 1), matchedPatterns };
}

function detectPropaganda(title, channelName) {
    const matchedPatterns = [];
    let score = 0;
    for (const p of PROPAGANDA_PATTERNS) {
        if (p.test(title) || p.test(channelName || '')) { matchedPatterns.push(p.source); score += 0.5; }
    }
    return { isPropaganda: score >= 0.5, confidence: Math.min(score, 1), matchedPatterns };
}

function detectChinaOrigin(title, channelName) {
    const matchedIndicators = [];
    let score = 0;
    for (const p of CHINA_ORIGIN_INDICATORS) {
        if (p.test(channelName || '') || p.test(title)) { matchedIndicators.push(p.source); score += 0.5; }
    }
    let termHits = 0;
    for (const p of CHINA_TERMINOLOGY) { if (p.test(title)) termHits++; }
    if (termHits >= 2) { matchedIndicators.push(`terminology:${termHits}`); score += 0.3; }
    const chSimplified = detectSimplifiedChinese(channelName || '');
    if (chSimplified.isSimplified) { matchedIndicators.push('channel_simplified'); score += 0.6; }
    return { isChinaOrigin: score >= 0.5, confidence: Math.min(score, 1), matchedIndicators };
}

// ============================================================
// SECTION F: AI GENERATED DETECTION (NEW)
// ============================================================

/**
 * Detect AI-generated video characteristics.
 * Uses patterns from ai-warfare-patterns.js and multi-signal analysis.
 */
function detectAIGenerated(title, channelName, metadata) {
    const signals = [];
    let score = 0;

    // --- Signal 1: AI Title Patterns ---
    if (typeof AI_TITLE_PATTERNS !== 'undefined') {
        for (const p of AI_TITLE_PATTERNS) {
            if (p.test(title)) { signals.push(`title:${p.source}`); score += 0.2; }
        }
    }

    // --- Signal 2: AI TTS Title Patterns ---
    if (typeof AI_TTS_TITLE_PATTERNS !== 'undefined') {
        for (const p of AI_TTS_TITLE_PATTERNS) {
            if (p.test(title)) { signals.push(`tts:${p.source}`); score += 0.15; }
        }
    }

    // --- Signal 3: Cognitive Warfare Narrative Patterns ---
    if (typeof COGNITIVE_WARFARE_NARRATIVES !== 'undefined') {
        let narrativeHits = 0;
        for (const p of COGNITIVE_WARFARE_NARRATIVES) {
            if (p.test(title)) { signals.push(`narrative:${p.source}`); narrativeHits++; score += 0.25; }
        }
        // Multiple narrative hits = strong AI generation signal
        if (narrativeHits >= 2) score += 0.2;
    }

    // --- Signal 4: Channel Name Anomaly ---
    if (typeof CHANNEL_ANOMALY_SIGNALS !== 'undefined' && channelName) {
        for (const p of CHANNEL_ANOMALY_SIGNALS.channelNamePatterns) {
            if (p.test(channelName)) { signals.push(`channel:${p.source}`); score += 0.2; break; }
        }
    }

    // --- Signal 5: Title Structure Analysis ---
    const titleSignals = extractTitleSignals(title);

    // Very long titles with high punctuation density = AI clickbait
    if (titleSignals.length > 30 && titleSignals.punctuationDensity > 0.05) {
        signals.push('long_clickbait_title');
        score += 0.15;
    }

    // Numeric listicle format
    if (titleSignals.hasNumbers) {
        signals.push('listicle_format');
        score += 0.1;
    }

    // Excessive punctuation
    if (titleSignals.exclCount >= 2 || titleSignals.questCount >= 2) {
        signals.push('excessive_punctuation');
        score += 0.15;
    }

    // --- Signal 6: Metadata Cross-Validation ---
    if (metadata) {
        // Very short videos with sensational titles = AI generated compilations
        if (metadata.duration && metadata.duration < 180 && score > 0.2) {
            signals.push('short_with_clickbait');
            score += 0.1;
        }

        // Very long "compilation" style — AI TTS with stock images
        if (metadata.duration && metadata.duration > 3600) {
            signals.push('long_compilation');
            score += 0.1;
        }
    }

    // --- Signal 7: Simplified Chinese + Other Signals Synergy ---
    const simplified = detectSimplifiedChinese(title);
    if (simplified.isSimplified && score >= 0.2) {
        // Simplified Chinese content with AI patterns = much higher confidence
        signals.push('simplified_synergy');
        score += 0.15;
    }

    // --- Signal 8: China Terminology in Title (expanded) ---
    if (typeof CHINA_TERMINOLOGY_EXPANDED !== 'undefined') {
        let expandedTermHits = 0;
        for (const p of CHINA_TERMINOLOGY_EXPANDED) {
            if (p.test(title)) expandedTermHits++;
        }
        if (expandedTermHits >= 3) {
            signals.push(`china_terms:${expandedTermHits}`);
            score += 0.15;
        }
    }

    return {
        isAIGenerated: score >= 0.4,
        confidence: Math.min(score, 1),
        signals,
        signalCount: signals.length,
    };
}

// ============================================================
// SECTION G: COMPOSITE ANALYZER
// ============================================================

/**
 * Main analysis function — multi-signal weighted analysis.
 * Replaces the original analyzeVideo() in content.js.
 */
function analyzeVideo(title, channelName, card) {
    const metadata = extractMetadataSignals(card);

    const simplified = detectSimplifiedChinese(`${title} ${channelName || ''}`);
    const contentFarm = detectContentFarm(title, channelName);
    const aiFake = detectAIFakeKnowledge(title);
    const propaganda = detectPropaganda(title, channelName);
    const chinaOrigin = detectChinaOrigin(title, channelName);
    const aiGenerated = detectAIGenerated(title, channelName, metadata);

    // Red-label channel blacklist — instant match, highest priority
    const blacklisted = CHANNEL_BLACKLIST.some(p => p.test(channelName || ''));
    if (blacklisted) {
        console.log(DETECTOR_LOG, `Blacklisted channel: 「${channelName}」`);
    }

    const detections = {};
    let shouldAct = false;
    if (simplified.isSimplified) { detections[DETECTION_CATEGORIES.SIMPLIFIED_CHINESE] = simplified; shouldAct = true; }
    if (contentFarm.isContentFarm) { detections[DETECTION_CATEGORIES.CONTENT_FARM] = contentFarm; shouldAct = true; }
    if (aiFake.isAIFake) { detections[DETECTION_CATEGORIES.AI_FAKE_KNOWLEDGE] = aiFake; shouldAct = true; }
    if (propaganda.isPropaganda || blacklisted) {
        detections[DETECTION_CATEGORIES.CHINA_PROPAGANDA] = propaganda.isPropaganda
            ? propaganda
            : { isPropaganda: true, confidence: 1, matchedIndicators: ['blacklisted_channel'] };
        shouldAct = true;
    }
    if (chinaOrigin.isChinaOrigin) { detections[DETECTION_CATEGORIES.CHINA_ORIGIN] = chinaOrigin; shouldAct = true; }
    if (aiGenerated.isAIGenerated) { detections[DETECTION_CATEGORIES.AI_GENERATED] = aiGenerated; shouldAct = true; }

    const confidences = Object.values(detections).map(d => d.confidence || 0);

    // Cross-signal confidence boost: if multiple categories detected, boost overall
    let overallConfidence = confidences.length ? Math.max(...confidences) : 0;
    if (Object.keys(detections).length >= 3) overallConfidence = Math.min(overallConfidence + 0.15, 1);
    if (Object.keys(detections).length >= 4) overallConfidence = Math.min(overallConfidence + 0.1, 1);

    return {
        shouldAct,
        detections,
        overallConfidence,
        categoriesDetected: Object.keys(detections),
        metadata,
    };
}

/**
 * Determine severity color from detected categories.
 * PURPLE for AI-generated, RED for propaganda or multi-category, YELLOW/GREEN for lower severity.
 */
function determineSeverity(categories) {
    if (categories.includes(DETECTION_CATEGORIES.CHINA_PROPAGANDA)) return SEVERITY.RED;
    if (categories.includes(DETECTION_CATEGORIES.AI_GENERATED) && categories.length >= 2) return SEVERITY.RED;
    if (categories.includes(DETECTION_CATEGORIES.AI_GENERATED)) return SEVERITY.PURPLE;
    if (categories.length >= 2) return SEVERITY.RED;
    if (categories.length === 1) return SEVERITY.YELLOW;
    return SEVERITY.GREEN;
}
