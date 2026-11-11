// SOLIDWORKS ACADEMY - Interactive Quiz Engine & Timer Manager

document.addEventListener('DOMContentLoaded', () => {
  console.log('SOLIDWORKS ACADEMY - Quiz Engine (quiz.js) cargado.');
});

const QuizEngine = {
  timerInterval: null,
  timeRemainingSeconds: 0,
  currentQuizData: null,

  // Inicializar cuestionario o simulador con límite de tiempo
  startQuiz: function(quizConfig) {
    this.currentQuizData = quizConfig;
    this.timeRemainingSeconds = (quizConfig.timeLimitMinutes || 30) * 60;
    
    this.renderTimer();
    this.startTimer();
  },

  // Iniciar temporizador regresivo
  startTimer: function() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timeRemainingSeconds--;
      this.renderTimer();

      if (this.timeRemainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert('⏰ ¡El tiempo del examen ha finalizado! Se evaluarán las respuestas registradas hasta el momento.');
        this.submitQuiz();
      }
    }, 1000);
  },

  // Mostrar el tiempo en formato MM:SS
  renderTimer: function() {
    const timerDisplay = document.getElementById('quiz-timer');
    if (!timerDisplay) return;

    const minutes = Math.floor(this.timeRemainingSeconds / 60);
    const seconds = this.timeRemainingSeconds % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timerDisplay.textContent = formatted;
    
    // Cambiar color de advertencia cuando falten menos de 5 minutos
    if (this.timeRemainingSeconds < 300) {
      timerDisplay.style.color = 'var(--danger)';
      timerDisplay.style.fontWeight = 'bold';
    }
  },

  // Evaluar respuestas recibidas y calcular puntuación
  evaluateAnswers: function(formId, correctAnswers, competencyMap) {
    const form = document.getElementById(formId);
    if (!form) return;

    const formData = new FormData(form);
    let correctCount = 0;
    let totalQuestions = Object.keys(correctAnswers).length;

    for (const [qId, correctAnswer] of Object.entries(correctAnswers)) {
      const userAnswer = formData.get(qId);
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Detener temporizador
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Registrar en AppState (LocalStorage)
    AppState.recordQuizResult(formId, percentage, competencyMap);

    return {
      score: percentage,
      correctCount: correctCount,
      totalQuestions: totalQuestions
    };
  },

  // Enviar y procesar evaluación
  submitQuiz: function() {
    if (!this.currentQuizData) return;

    const result = this.evaluateAnswers(
      this.currentQuizData.formId,
      this.currentQuizData.correctAnswers,
      this.currentQuizData.competencyMap
    );

    if (result) {
      alert(`🎯 Evaluación completada.\n\nResultado: ${result.score}% (${result.correctCount}/${result.totalQuestions} respuestas correctas).\nTu diagnóstico CSWA ha sido actualizado.`);
      window.location.reload();
    }
  }
};
