async function loadTripData() {
  const response = await fetch("./trip-data.json");
  if (!response.ok) throw new Error("trip-data.json을 불러오지 못했습니다.");
  return response.json();
}

function formatKRW(value) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

function mountBasic(data) {
  document.title = data?.meta?.title || document.title;
}

loadTripData().then(mountBasic).catch((error) => {
  console.error(error);
});
