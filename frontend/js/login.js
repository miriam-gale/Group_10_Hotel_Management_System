const loginForm = document.getElementById("managerLoginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;


    loginError.textContent = "";
    loginError.classList.remove("show");


    try {

        const response = await fetch(
            "http://localhost:3000/api/auth/manager/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Login failed."
            );

        }


        // Save the authentication information
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("managerName", data.name);


        // Go to the dashboard
        window.location.href = "../index.html";


    } catch (error) {

        loginError.textContent = error.message;
        loginError.classList.add("show");

    }

});