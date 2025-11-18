const loginBtn = document.getElementById("google-login");

loginBtn.addEventListener("click", async () => {
    const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + "/index.html"
        }
    });
    if (error) console.error("Login error:", error);
});

(async function checkSession() {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
        window.location.href = "index.html";
    }
})();
