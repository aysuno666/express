const FEEDBACK_FORM = document.querySelector("#form");
const FORM_2 = document.querySelector('#formId');
const submitBtn = document.querySelector(".btn-order");
var btnloader = document.querySelectorAll(".btn-loader");
const toaster = document.querySelector(".toaster");
var btn = document.querySelectorAll('.btn');

const toasterErr = document.querySelector('.toasterErr');

function generateToken() {
  return fetch('/generate-link')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }
      return response.text();
    });
}

window.addEventListener("load", () => {
  const loader = document.querySelector(".loader");
  setTimeout(() => {
    loader.classList.add("loader-hidden");
    loader.addEventListener("transitionend", () => {
      document.body.removeChild("loader");
    });
  });
});

function hideToaster() {
  toaster.classList.add("hidden");
}

function hideToasterErr() {
  toasterErr.classList.add("hidden");
}

function zayavkaError() {
  btnloader.forEach(element => {
    element.classList.add("btn-loader-hidden");
  });

  toasterErr.classList.remove("hidden");
  btn.forEach(element => {
    element.removeAttribute('disabled');
  });
  setTimeout(hideToasterErr, 1100);
}

function zayavka(e) {
  
  btnloader.forEach(element => {
    element.classList.add("btn-loader-hidden");
  });

  toaster.classList.remove("hidden");
  const feedbackFormData = new FormData(e.target);
  const feedback = Object.fromEntries(feedbackFormData);

  btn.forEach(element => {
    element.removeAttribute('disabled');
  });

  e.target.reset();
  setTimeout(hideToaster, 1100);
  setTimeout(() => sendFeedbackWithToken(feedback), 1100);
}

function validate(e) {
  var inputName = e.target.querySelector('.inputName');
  var inputPhone = e.target.querySelector('.inputPhone');
  var inputEmail = e.target.querySelector('.inputEmail');

  if (inputName.value === '' || inputPhone.value === '' || inputEmail.value === '') {
    setTimeout(zayavkaError, 1200);
    return false;
  }

  setTimeout(() => zayavka(e), 1200);
  return false;
}


function sendFeedbackWithToken(feedback) {
  generateToken()
    .then(link => {
      feedback.link = link; // Добавляем токен к данным формы
      sendFeedback(feedback); // Отправляем данные формы на сервер
    })
    .catch(error => {
      console.error('Error generating token:', error);
    });
}

function sendFeedback(feedback) {
  fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedback),
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {})
    .catch((error) => {
      console.error("Error:", error);
    });
}

FEEDBACK_FORM.addEventListener("submit", (e) => {
  e.preventDefault();
  btnloader.forEach(element => {
    element.classList.remove("btn-loader-hidden");
  });

  btn.forEach(element => {
    element.setAttribute('disabled', true);
  });

  if (!validate(e)) {
    return false;
  }
  zayavka(e);
});

FORM_2.addEventListener("submit", (e) => {
  e.preventDefault();

  btnloader.forEach(element => {
    element.classList.remove("btn-loader-hidden");
  });

  btn.forEach(element => {
    element.setAttribute('disabled', true);
  });

  if (!validate(e)) {
    return false;
  }
  zayavka(e);
});
