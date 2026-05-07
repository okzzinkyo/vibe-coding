async function loadTripData() {
  const response = await fetch("./trip-data.json");
  if (!response.ok) throw new Error("trip-data.json을 불러오지 못했습니다.");
  return response.json();
}

function formatKRW(value) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

function renderHero(meta) {
  const heroSection = document.getElementById("hero");
  heroSection.innerHTML = `
    <div class="container">
      <span class="hero-badge">${meta.dateRange} · ${meta.nightsDays}</span>
      <h1>${meta.title}</h1>
      <p>${meta.subtitle}</p>
    </div>
  `;
  document.title = meta.title;
}

function renderProcess(agents) {
  const processSection = document.getElementById("process");
  processSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">How It Was Made</h2>
      <div class="agent-grid">
        ${agents.map(agent => `
          <div class="agent-card">
            <span class="agent-name">${agent.name}</span>
            <p class="agent-summary">${agent.summary}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderBudget(budgetTiers) {
  const budgetSection = document.getElementById("budget");
  const tiers = Object.keys(budgetTiers);
  
  function updateBudgetContent(tierKey) {
    const tier = budgetTiers[tierKey];
    const contentArea = document.querySelector(".budget-content");
    contentArea.innerHTML = `
      <h3>${tier.label} 플랜</h3>
      <p class="total-price">${formatKRW(tier.totalKRW)}</p>
      <p>${tier.description}</p>
    `;
    
    document.querySelectorAll(".budget-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tier === tierKey);
    });
  }

  budgetSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">Budget</h2>
      <div class="budget-tabs">
        ${tiers.map(key => `
          <button class="budget-tab" data-tier="${key}">${budgetTiers[key].label}</button>
        `).join("")}
      </div>
      <div class="budget-content"></div>
    </div>
  `;

  budgetSection.querySelectorAll(".budget-tab").forEach(tab => {
    tab.addEventListener("click", () => updateBudgetContent(tab.dataset.tier));
  });

  updateBudgetContent("standard"); // Default
}

function renderDays(days) {
  const daysSection = document.getElementById("days");
  daysSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">Day by Day</h2>
      <div class="days-list">
        ${days.map(day => `
          <div class="day-card" id="day-${day.day}">
            <div class="day-header" onclick="this.parentElement.classList.toggle('open')">
              <div class="day-info">
                <span>Day ${day.day} · ${day.date}</span>
                <h3>${day.theme}</h3>
              </div>
              <div class="day-toggle">▼</div>
            </div>
            <div class="day-body">
              <p>${day.summary}</p>
              <ul class="timeline">
                ${day.timeline.map(item => `
                  <li class="timeline-item">
                    <span class="time">${item.time}</span>
                    <div class="timeline-content">
                      <span class="task">${item.task}</span>
                      <span class="note">${item.note}</span>
                    </div>
                  </li>
                `).join("")}
              </ul>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderGuide(guide) {
  const guideSection = document.getElementById("guide");
  guideSection.innerHTML = `
    <div class="container">
      <h2 class="section-title">Local Guide</h2>
      <div class="guide-grid">
        <div class="guide-category">
          <h3>공항 및 교통</h3>
          ${guide.transport.map(item => `
            <div class="guide-item">
              <strong>${item.name}</strong>
              <span>${item.desc}</span>
            </div>
          `).join("")}
        </div>
        <div class="guide-category">
          <h3>미식 가이드</h3>
          ${guide.foodHighlights.map(item => `
            <div class="guide-item">
              <strong>${item.name}</strong>
              <span>${item.desc}</span>
            </div>
          `).join("")}
        </div>
        <div class="guide-category">
          <h3>필수 에티켓</h3>
          ${guide.etiquette.map(item => `
            <div class="guide-item">
              <strong>${item.title}</strong>
              <span>${item.desc}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderFooter(meta) {
  const footer = document.getElementById("footer");
  footer.innerHTML = `
    <div class="container">
      <p>${meta.updatedNote}</p>
      <p>© 2024 AI Travel Planner. Created with Gemini Agents.</p>
    </div>
  `;
}

loadTripData().then(data => {
  renderHero(data.meta);
  renderProcess(data.agents);
  renderBudget(data.budgetTiers);
  renderDays(data.days);
  renderGuide(data.localGuide);
  renderFooter(data.meta);
}).catch(err => {
  console.error(err);
  document.body.innerHTML = `<div style="padding: 50px; text-align: center;"><h1>데이터를 불러오는 중 오류가 발생했습니다.</h1><p>${err.message}</p></div>`;
});
