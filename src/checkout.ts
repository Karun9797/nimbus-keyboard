export async function checkout() {
  try {
    const response = await fetch("/api/checkout/vapor75", { method: "POST" });
    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    console.error("Purchased Failed: ", error);
  }
}
