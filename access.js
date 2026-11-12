(() => {
  "use strict";

  const form = document.getElementById("access-form");
  const input = document.getElementById("survey-password");
  const submit = document.getElementById("access-submit");
  const error = document.getElementById("access-error");

  function setError(message) {
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    const password = input.value;
    if (!password) {
      setError("Введите пароль.");
      input.focus();
      return;
    }

    submit.disabled = true;
    submit.classList.add("is-loading");
    try {
      const response = await fetch("api/survey/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Не удалось проверить пароль. Попробуйте ещё раз.");
        input.select();
        input.focus();
        return;
      }
      window.location.replace(window.location.href);
    } catch {
      setError("Нет связи с сервером. Проверьте подключение и повторите попытку.");
    } finally {
      submit.disabled = false;
      submit.classList.remove("is-loading");
    }
  });
})();
