// filepath: src/utils/api.js
export async function fetchDengueData() {
  const response = await fetch("/api/dengue-data");
  return response.json();
}
