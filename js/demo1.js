const options = document.querySelectorAll(".option");
const feedbackOk = document.getElementById("feedbackOk");
const feedbackBad = document.getElementById("feedbackBad");
const lesson = document.getElementById("lesson");
const resetBtn = document.getElementById("resetBtn");
const welcomeText = document.getElementById("welcomeText");
const participantName = document.getElementById("participantName");
const participantRole = document.getElementById("participantRole");
const profileIcon = document.getElementById("profileIcon");

const profile = window.MICProfile?.load();

if (profile?.displayName) {
  welcomeText.textContent = `Bienvenido/a, ${profile.displayName}`;
  participantName.textContent = profile.displayName;
  participantRole.textContent = window.MICProfile.roleLabel(profile);
  profileIcon.textContent = window.MICProfile.initialsFromName(profile.displayName);
}

options.forEach((option) => {
  option.addEventListener("click", () => {
    const isCorrect = option.dataset.correct === "true";

    checkAnswer(option, isCorrect);
  });
});

resetBtn.addEventListener("click", resetQuiz);

function checkAnswer(selectedOption, isCorrect) {
  options.forEach((option) => {
    option.disabled = true;
    option.style.cursor = "not-allowed";
  });

  if (isCorrect) {
    selectedOption.classList.add("correct");

    feedbackOk.style.display = "block";
    feedbackBad.style.display = "none";
  } else {
    selectedOption.classList.add("incorrect");

    feedbackBad.style.display = "block";
    feedbackOk.style.display = "none";

    showCorrectAnswer();
  }

  lesson.style.display = "block";
  resetBtn.style.display = "block";
}

function showCorrectAnswer() {
  options.forEach((option) => {
    if (option.dataset.correct === "true") {
      option.classList.add("correct");
    }
  });
}

function resetQuiz() {
  options.forEach((option) => {
    option.disabled = false;
    option.classList.remove("correct", "incorrect");
    option.style.cursor = "pointer";
  });

  feedbackOk.style.display = "none";
  feedbackBad.style.display = "none";
  lesson.style.display = "none";
  resetBtn.style.display = "none";
}
