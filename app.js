const bracketRoot = document.querySelector("#bracket");
const sourceButtons = [...document.querySelectorAll(".source-toggle__button")];
const defaultDataSource = "./tournament-bracket.json";
let activeDataSource =
  sourceButtons.find((button) => button.classList.contains("is-active"))?.dataset.source ||
  defaultDataSource;

const fallbackBracket = [
  {
    stage: "Semi-finals",
    matches: [
      {
        team1: {
          name: "Франція",
          logoUrl: "https://flagcdn.com/fr.svg",
          isActive: true,
        },
        team2: {
          name: "Іспанія",
          logoUrl: "https://flagcdn.com/es.svg",
          isActive: true,
        },
        matchDate: "2026-07-14T22:00:00+03:00",
        score: "",
        isFinished: false,
        feed_url: "https://feed.pm/api/v1/event/mfi-6a5160f5a9d3f5.77316886",
      },
      {
        team1: {
          name: "Англія",
          logoUrl: "https://flagcdn.com/gb-eng.svg",
          isActive: true,
        },
        team2: {
          name: "Аргентина",
          logoUrl: "https://flagcdn.com/ar.svg",
          isActive: true,
        },
        matchDate: "2026-07-15T22:00:00+03:00",
        score: "",
        isFinished: false,
        feed_url: "https://feed.pm/api/v1/event/mfi-6a5333dcea8d43.00242242",
      },
    ],
  },
  {
    stage: "Final",
    matches: [
      {
        team1: {
          name: "TBD",
          logoUrl: "",
          isActive: false,
        },
        team2: {
          name: "TBD",
          logoUrl: "",
          isActive: false,
        },
        matchDate: "2026-07-19T22:00:00+03:00",
        score: "",
        isFinished: false,
        feed_url: "",
      },
    ],
  },
];

const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatter.format(date).replace(",", "");
}

function parseScore(score) {
  if (typeof score !== "string" || !score.trim()) {
    return null;
  }

  const parts = score.split(":").map((value) => value.trim());

  if (parts.length !== 2 || parts.some((value) => value === "")) {
    return null;
  }

  return parts;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function createTeam(team, scoreValue) {
  const row = document.createElement("div");
  row.className = `team${team.isActive ? " is-active" : ""}`;

  if (team.logoUrl && team.name !== "TBD") {
    const logo = document.createElement("img");
    logo.className = "team-logo";
    logo.src = team.logoUrl;
    logo.alt = "";
    logo.loading = "lazy";
    row.append(logo);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "team-placeholder";
    row.append(placeholder);
  }

  const name = document.createElement("span");
  name.className = "team-name";
  name.textContent = team.name;
  row.append(name);

  if (scoreValue !== undefined) {
    const metric = document.createElement("span");
    metric.className = "team-metric team-metric--score";
    metric.textContent = scoreValue;
    row.append(metric);
  }

  return row;
}

function getDrawOdd(feedData) {
  return (
    feedData?.coff_x ??
    feedData?.coff_draw ??
    feedData?.coff_d ??
    feedData?.coff_p0 ??
    feedData?.coff_0 ??
    null
  );
}

function extractOdds(feedData, match) {
  if (feedData?.coff_p1 && feedData?.coff_p2) {
    const p1 = normalizeName(feedData.p1);
    const p2 = normalizeName(feedData.p2);
    const team1 = normalizeName(match.team1.name);
    const team2 = normalizeName(match.team2.name);

    if (p1 === team1 && p2 === team2) {
      return [feedData.coff_p1, getDrawOdd(feedData), feedData.coff_p2];
    }

    if (p1 === team2 && p2 === team1) {
      return [feedData.coff_p2, getDrawOdd(feedData), feedData.coff_p1];
    }

    return [feedData.coff_p1, getDrawOdd(feedData), feedData.coff_p2];
  }

  return null;
}

function createOddsBlock(match) {
  const odds = document.createElement("div");
  odds.className = `odds-row${match.isFinished ? " odds-row--finished" : ""}`;

  [
    ["П1", "-"],
    ["X", "-"],
    ["П2", "-"],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "odds-cell";
    item.dataset.odd = label;

    const labelEl = document.createElement("span");
    labelEl.className = "odds-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "odds-value";
    valueEl.textContent = value;

    item.append(labelEl, valueEl);
    odds.append(item);
  });

  return odds;
}

async function loadMatchOdds(match, card) {
  if (match.isFinished || !match.feed_url) {
    return;
  }

  try {
    const response = await fetch(match.feed_url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Cannot load odds feed: ${response.status}`);
    }

    const odds = extractOdds(await response.json(), match);

    if (!odds) {
      return;
    }

    card.querySelectorAll(".odds-value").forEach((value, index) => {
      value.textContent = odds[index] ?? "-";
    });
  } catch (error) {
    console.error(error);
  }
}

function createMatch(match) {
  const card = document.createElement("article");
  card.className = "match";

  const date = document.createElement("div");
  date.className = "match-date";
  date.textContent = formatDate(match.matchDate);

  const score = parseScore(match.score);

  card.append(
    date,
    createTeam(match.team1, score?.[0] ?? ""),
    createTeam(match.team2, score?.[1] ?? ""),
    createOddsBlock(match),
  );

  loadMatchOdds(match, card);

  return card;
}

function createStage(stage, index) {
  const column = document.createElement("section");
  column.className = "stage";
  column.dataset.stageIndex = String(index);

  const title = document.createElement("h2");
  title.className = "stage-title";
  title.textContent = stage.stage;

  const list = document.createElement("div");
  list.className = "match-list";
  stage.matches.forEach((match) => list.append(createMatch(match)));

  column.append(title, list);

  return column;
}

function renderData(data) {
  bracketRoot.replaceChildren(...data.map(createStage));
}

function setActiveSource(source) {
  activeDataSource = source;
  sourceButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.source === source);
  });
}

function showLoadWarning() {
  document.querySelector(".data-warning")?.remove();

  const warning = document.createElement("div");
  warning.className = "data-warning";
  warning.textContent =
    "Показую вбудований приклад. Щоб бачити зміни з JSON, відкрий сторінку через локальний HTTP-сервер.";
  bracketRoot.before(warning);
}

async function renderBracket(source = activeDataSource) {
  setActiveSource(source);
  document.querySelector(".data-warning")?.remove();

  try {
    const response = await fetch(source, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Cannot load bracket JSON: ${response.status}`);
    }

    const data = await response.json();
    renderData(data);
  } catch (error) {
    showLoadWarning();
    renderData(fallbackBracket);
    console.error(error);
  }
}

sourceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderBracket(button.dataset.source);
  });
});

renderBracket();
