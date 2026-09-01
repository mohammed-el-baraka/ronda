/**
 * Moroccan Ronda - Interactive Multilingual Rules Modal
 * Features comprehensive explanations with 3oud & 7ajra, 4-3-3 Dealing, and 9a3a b'12 rules.
 */

const RULES_CONTENT = {
  ar: {
    title: '📖 قواعد الروندا المغربية الأصلية (العواد والحجرات)',
    sections: [
      {
        heading: '🪵 نظام النقط: العواد (3oud) والحجرات (7ajra)',
        body: `
          في الروندا المغربية التقليدية الحساب كيكون بـ <strong>العواد والحجرات</strong>:
          <ul>
            <li>🪨 <strong>الحجرة (7ajra):</strong> نقطة وحدة (+1). ملي كتجمع <strong>5 حجرات</strong> كيرجعو <strong>عود واحد (1 3oud)</strong>!</li>
            <li>🪵 <strong>العود (3oud):</strong> كيساوي <strong>5 حجرات (5 نقط)</strong>.</li>
          </ul>
        `
      },
      {
        heading: '🏆 نظام الدفوع (الدفوع الأول والدفوع الثاني - 41 نقطة)',
        body: `
          الماتش كيتلعب على جوج دفوعات:
          <ul>
            <li>🥇 <strong>الدفوع الأول (1st Dfo3):</strong> الهدف ديالو هو <strong>4 عواد (20 نقطة)</strong>. الفرقة لي وصلات لـ 4 عواد كتدي الدفوع الأول.</li>
            <li>👑 <strong>الدفوع الثاني (2nd Dfo3):</strong> الهدف ديالو هو <strong>4 عواد وحجرة (21 نقطة)</strong>. أول فرقة كتوصل لـ 4 عواد وحجرة كتربح الماتش كامل بـ <strong>41 نقطة</strong>!</li>
          </ul>
        `
      },
      {
        heading: '🎴 نظام التفريقة لـ 4 لاعبين (4 ثم 3 ثم 3)',
        body: `
          الكارطة فيها <strong>40 ورقة</strong> مقسمة لـ 4 أنواع (ذهب، كؤوس، سيوف، عصي).
          <br>اللعب كيدور على <strong>اليسار (Left Side)</strong>، والتفريقة كتكون على 3 دفعات:
          <ul>
            <li><strong>التفريقة الأولى:</strong> <strong>4 أوراق</strong> لكل لاعب (4 × 4 = 16 ورقة).</li>
            <li><strong>التفريقة الثانية:</strong> <strong>3 أوراق</strong> لكل لاعب (3 × 4 = 12 ورقة).</li>
            <li><strong>التفريقة الثالثة:</strong> <strong>3 أوراق</strong> لكل لاعب (3 × 4 = 12 ورقة).</li>
          </ul>
          المجموع: 16 + 12 + 12 = <strong>40 ورقة كاملة</strong>!
        `
      },
      {
        heading: '👑 قاعدة القاعة بالشيخ (9a3a b\'12 = 1 عود)',
        body: `
          <ul>
            <li><strong>القاعة (9a3a):</strong> هي آخر رمية وآخر قمرة في اليد (الورقة رقم 40).</li>
            <li>إذا درتي الماكلة في القاعة بالرقم <strong>12 (الشيخ / ري)</strong> ➔ كتربح <strong>1 عود كامل (5 نقط)</strong> مباشرة!</li>
          </ul>
        `
      },
      {
        heading: '✨ الإعلانات والكومبوات: الروندا، الترينغا، والكواطرو',
        body: `
          في بداية كل تفريقة، اللعبة كتعلن شكون عندو كومبو بلا ما تفضح النمرة ديال الكارطة باش تبقى السرية:
          <ul>
            <li>✨ <strong>روندا (Ronda - زوج أوراق):</strong> إذا الفرقتين بجوج عندهم روندا، مول أكبر كارطة كيربح وكيدي نقاط الروندا ديال الخصم كاملين (+1 حجرة لكل روندا).</li>
            <li>🔥 <strong>ترينغا (Tringa - 3 أوراق = 1 عود):</strong> الترينغا كتغلب الروندا وكتدي نقاط جميع الروندات ديال الخصوم مع العود ديالها!</li>
            <li>👑 <strong>كواطرو (Quarteto - 4 أوراق = 2 عواد):</strong> الكواطرو هو القمة، كيدي نقاط جميع الترينغات والروندات ديال الخصوم!</li>
          </ul>
        `
      },
      {
        heading: '💥 الضرب والخلاص (Darb, Khlis & Basta)',
        body: `
          <ul>
            <li>🎯 <strong>الضربة / الكارطة:</strong> ضربتي كارطة لي عاد حطها صاحبك على اليسار ➔ <strong>+1 حجرة</strong>.</li>
            <li>💥 <strong>الخلاص (Khlis):</strong> لي موراك رد الضربة ➔ <strong>+1 عود (5 نقط)</strong>!</li>
            <li>⚡ <strong>زيد خلص:</strong> التالت رد الضربة ➔ <strong>+2 عواد (10 نقط)</strong>!</li>
            <li>👑 <strong>باستا (Basta):</strong> ضربو بربعة ➔ <strong>+3 عواد (15 نقطة)</strong>!</li>
            <li>🧹 <strong>الميسة (Missa):</strong> مسحتي الطابلة كاملة ➔ <strong>+1 حجرة</strong>.</li>
          </ul>
        `
      },
      {
        heading: '📊 حساب الأوراق في نهاية اليد (20 ورقة)',
        body: `
          المعدل هو 20 ورقة. الفرقة لي جابت أكثر من 20 كتاخد حجرة على كل ورقة زايدة: <code>الحجرات = مجموع الأوراق - 20</code>.
        `
      }
    ]
  },

  fr: {
    title: '📖 Règles Authentiques : 3oud, 7ajra, Dfo3 & 9a3a',
    sections: [
      {
        heading: '🪵 Système des Bâtons (3oud) et Pierres (7ajra)',
        body: `
          <ul>
            <li>🪨 <strong>1 7ajra (Pierre) = 1 point</strong>. 5 pierres se transforment automatiquement en <strong>1 3oud (Bâton)</strong> !</li>
            <li>🪵 <strong>1 3oud (Bâton) = 5 points</strong>.</li>
          </ul>
        `
      },
      {
        heading: '🏆 Les 2 Dfo3 (Manches à 41 points)',
        body: `
          <ul>
            <li>🥇 <strong>1er Dfo3 :</strong> Objectif = <strong>4 3ouds (20 points)</strong>.</li>
            <li>👑 <strong>2ème Dfo3 :</strong> Objectif = <strong>4 3ouds + 1 7ajra (21 points)</strong>. Première équipe à totaliser 41 points gagne le match !</li>
          </ul>
        `
      },
      {
        heading: '🎴 Distribution 4-3-3 (40 cartes)',
        body: `
          Le tour tourne vers la <strong>gauche</strong> :
          <ul>
            <li>1ère donne : <strong>4 cartes</strong> chacun (16 cartes).</li>
            <li>2ème donne : <strong>3 cartes</strong> chacun (12 cartes).</li>
            <li>3ème donne : <strong>3 cartes</strong> chacun (12 cartes).</li>
            <li>Total = 16 + 12 + 12 = 40 cartes.</li>
          </ul>
        `
      },
      {
        heading: '👑 Règle de la 9a3a au Roi (12) = 1 3oud',
        body: `
          Si vous réalisez la prise sur la toute dernière carte de la main (la 9a3a) avec un <strong>12 (Roi / Rey)</strong>, vous marquez immédiatement <strong>1 3oud (5 points)</strong> !
        `
      }
    ]
  },

  en: {
    title: '📖 Authentic Rules: 3oud, 7ajra, Dfo3 & 9a3a b\'12',
    sections: [
      {
        heading: '🪵 Scoring Units: 3oud (Stick) & 7ajra (Pebble)',
        body: `
          <ul>
            <li>🪨 <strong>1 7ajra = 1 point</strong>. Collecting 5 7ajrat converts directly into <strong>1 3oud</strong>!</li>
            <li>🪵 <strong>1 3oud = 5 points (5 7ajrat)</strong>.</li>
          </ul>
        `
      },
      {
        heading: '🏆 The 2 Dfo3 Stages (41 Points Total)',
        body: `
          <ul>
            <li>🥇 <strong>1st Dfo3:</strong> Target = <strong>4 3ouds (20 points)</strong>.</li>
            <li>👑 <strong>2nd Dfo3:</strong> Target = <strong>4 3ouds + 1 7ajra (21 points)</strong>. The team that completes both Dfo3s (41 pts) wins the match!</li>
          </ul>
        `
      },
      {
        heading: '🎴 4-3-3 Dealing Sequence (40 Cards)',
        body: `
          Play rotates to the <strong>left</strong>:
          <ul>
            <li>Deal 1: <strong>4 cards</strong> each (16 cards).</li>
            <li>Deal 2: <strong>3 cards</strong> each (12 cards).</li>
            <li>Deal 3: <strong>3 cards</strong> each (12 cards).</li>
            <li>Total = 16 + 12 + 12 = 40 cards.</li>
          </ul>
        `
      },
      {
        heading: '👑 9a3a with a 12 (Rey / King) = 1 3oud',
        body: `
          If you make a capture on the very last trick of the hand (the 9a3a) using rank <strong>12 (King / Cheikh)</strong>, your team instantly scores <strong>1 3oud (5 points)</strong>!
        `
      }
    ]
  }
};

class RulesModalManager {
  constructor() {
    this.currentLang = 'ar';
  }

  renderRules(lang = 'ar') {
    this.currentLang = lang;
    const content = RULES_CONTENT[lang] || RULES_CONTENT.ar;
    const container = document.getElementById('rules-content-body');
    const titleEl = document.getElementById('rules-modal-title');

    if (titleEl) titleEl.innerHTML = content.title;
    if (!container) return;

    container.innerHTML = content.sections.map(sec => `
      <div class="rules-section">
        <h3>${sec.heading}</h3>
        <div class="rules-section-content">${sec.body}</div>
      </div>
    `).join('');

    document.querySelectorAll('.rules-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }
}

window.rulesModalManager = new RulesModalManager();
