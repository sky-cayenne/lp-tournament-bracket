const bracketRoot = document.querySelector("#bracket");

const fallbackBracket = [
  {
    stage: "Quarter-finals",
    matches: [
      {
        team1: {
          name: "Франція",
          logoUrl: "https://flagcdn.com/fr.svg",
          isActive: true,
        },
        team2: {
          name: "Марокко",
          logoUrl: "https://flagcdn.com/ma.svg",
          isActive: false,
        },
        matchDate: "2026-07-11T22:00:00+03:00",
        score: "2:0",
        feed_url: "https://feed.pm/api/v1/event/mfi-6a49f65de4a0d2.02359800",
      },
      {
        team1: {
          name: "Іспанія",
          logoUrl: "https://flagcdn.com/es.svg",
          isActive: true,
        },
        team2: {
          name: "Бельгія",
          logoUrl: "https://flagcdn.com/be.svg",
          isActive: true,
        },
        matchDate: "2026-07-12T22:00:00+03:00",
        score: "",
        feed_url: "https://feed.pm/api/v1/event/mfi-6a4c9cf9a60393.28538486",
      },
      {
        team1: {
          name: "Норвегія",
          logoUrl: "https://flagcdn.com/no.svg",
          isActive: true,
        },
        team2: {
          name: "Англія",
          logoUrl: "https://flagcdn.com/gb-eng.svg",
          isActive: true,
        },
        matchDate: "2026-07-13T00:00:00+03:00",
        score: "",
        feed_url: "https://feed.pm/api/v1/event/mfi-6a4b4e305a2763.41368061",
      },
      {
        team1: {
          name: "Аргентина",
          logoUrl: "https://flagcdn.com/ar.svg",
          isActive: true,
        },
        team2: {
          name: "Швейцарія",
          logoUrl: "https://flagcdn.com/ch.svg",
          isActive: true,
        },
        matchDate: "2026-07-13T04:00:00+03:00",
        score: "",
        feed_url: "https://feed.pm/api/v1/event/mfi-6a4de1e37351a2.72424131",
      },
    ],
  },
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
          name: "TBD",
          logoUrl: "",
          isActive: false,
        },
        matchDate: "2026-07-14T22:00:00+03:00",
        score: "",
        feed_url: "",
      },
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
        matchDate: "2026-07-15T22:00:00+03:00",
        score: "",
        feed_url: "",
      },
    ],
  },
  {
    stage: "3rd-place",
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
        matchDate: "2026-07-18T22:00:00+03:00",
        score: "",
        feed_url: "",
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

function createTeam(team, metricValue, metricType = "score") {
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

  if (metricValue !== undefined) {
    const metric = document.createElement("span");
    metric.className = `team-metric team-metric--${metricType}`;
    metric.textContent = metricValue;
    row.append(metric);
  }

  return row;
}

function extractOdds(feedData, match) {
  if (feedData?.coff_p1 && feedData?.coff_p2) {
    const p1 = normalizeName(feedData.p1);
    const p2 = normalizeName(feedData.p2);
    const team1 = normalizeName(match.team1.name);
    const team2 = normalizeName(match.team2.name);

    if (p1 === team1 && p2 === team2) {
      return [feedData.coff_p1, feedData.coff_p2];
    }

    if (p1 === team2 && p2 === team1) {
      return [feedData.coff_p2, feedData.coff_p1];
    }

    return [feedData.coff_p1, feedData.coff_p2];
  }

  return null;
}

async function loadMatchOdds(match, card) {
  if (!match.feed_url) {
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

    const [team1Metric, team2Metric] = card.querySelectorAll(".team-metric--odds");
    team1Metric.textContent = odds[0];
    team2Metric.textContent = odds[1];
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

  const shouldShowOdds = !score && Boolean(match.feed_url);

  card.append(
    date,
    createTeam(match.team1, score?.[0] ?? (shouldShowOdds ? "" : undefined), score ? "score" : "odds"),
    createTeam(match.team2, score?.[1] ?? (shouldShowOdds ? "" : undefined), score ? "score" : "odds"),
  );

  if (shouldShowOdds) {
    loadMatchOdds(match, card);
  }

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

function showLoadWarning() {
  const warning = document.createElement("div");
  warning.className = "data-warning";
  warning.textContent =
    "Показую вбудований приклад. Щоб бачити зміни з tournament-bracket.json, відкрий сторінку через http://127.0.0.1:5173/.";
  bracketRoot.before(warning);
}

async function renderBracket() {
  try {
    const response = await fetch("./tournament-bracket.json", { cache: "no-store" });

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

renderBracket();
