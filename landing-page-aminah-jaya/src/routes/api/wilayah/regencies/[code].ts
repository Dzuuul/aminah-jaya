export async function GET(event: { params: { code: string } }) {
    const { code } = event.params;
    const res = await fetch(`https://wilayah.id/api/regencies/${code}.json`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
    });
}