document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const form = document.getElementById("contactForm");

    if (!form) {
        return;
    }

    const successMessage = document.getElementById("successMessage");
    // Web3Forms access key (provided after email verification).
    const web3FormsAccessKey = "";

    form.querySelectorAll('input[required], textarea[required]').forEach((field) => {
        field.addEventListener("input", () => field.setCustomValidity(""));
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Reine Leerzeichen zählen nicht als ausgefüllte Pflichtfelder.
        const requiredTextFields = form.querySelectorAll(
            'input[required]:not([type="checkbox"]):not([type="radio"]), textarea[required]'
        );
        requiredTextFields.forEach((field) => {
            field.setCustomValidity(
                field.value.trim() ? "" : "Bitte fülle dieses Pflichtfeld aus."
            );
        });

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');

        if (successMessage) {
            successMessage.classList.remove("show");
            successMessage.textContent = "";
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Wird gesendet …";
        }

        const formData = new FormData(form);

        if (!web3FormsAccessKey) {
            const fields = Array.from(formData.entries())
                .filter(([key]) => key !== "datenschutz_bestaetigt")
                .map(([key, value]) => key + ": " + value)
                .join("\n\n");
            const subject = encodeURIComponent("Neue Projektanfrage – SOREVA Agency");
            const body = encodeURIComponent(fields);
            const mailLink = "mailto:soreva.agency@gmx.de?subject=" + subject + "&body=" + body;
            if (successMessage) {
                successMessage.textContent = "Dein E-Mail-Programm wird geöffnet. Bitte sende die vorbereitete Nachricht dort selbst ab. Die Anfrage wurde noch nicht automatisch übermittelt.";
                successMessage.classList.add("show");
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Anfrage senden";
            }
            window.location.href = mailLink;
            return;
        }
        formData.append("access_key", web3FormsAccessKey);
        formData.append("subject", "Neue Projektanfrage – SOREVA Agency");
        formData.append("from_name", "SOREVA Agency Website");
        formData.append("replyto", formData.get("email") || "");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const slowNoticeId = setTimeout(() => {
            if (successMessage) {
                successMessage.textContent = "Die Übermittlung dauert etwas länger. Bitte warte kurz …";
                successMessage.classList.add("show");
            }
        }, 5000);

        try {
            const response = await fetch(
                "https://api.web3forms.com/submit",
                {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            const result = await response.json();

            if (!response.ok || result.success !== true) {
                throw new Error(result.message || "Formular konnte nicht gesendet werden.");
            }

            form.reset();

            if (successMessage) {
                successMessage.textContent =
                    "Vielen Dank! Deine Anfrage wurde erfolgreich gesendet.";
                successMessage.classList.add("show");
            }

            window.scrollTo({
                top: form.offsetTop - 120,
                behavior: "smooth"
            });

        } catch (error) {
            if (successMessage) {
                successMessage.textContent = error.name === "AbortError"
                    ? "Die Übermittlung dauert zu lange. Ob die Anfrage angekommen ist, ist unklar. Bitte prüfe zuerst dein E-Mail-Postfach oder kontaktiere SOREVA direkt unter soreva.agency@gmx.de, bevor du erneut sendest."
                    : "Die Anfrage konnte nicht bestätigt werden. Bitte prüfe dein E-Mail-Postfach oder kontaktiere SOREVA unter soreva.agency@gmx.de.";
                successMessage.classList.add("show");
            }

            console.error("SOREVA Formular:", error);

        } finally {
            clearTimeout(timeoutId);
            clearTimeout(slowNoticeId);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Anfrage senden";
            }
        }
    });
});
