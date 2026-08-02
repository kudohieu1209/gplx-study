"use client";

import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  HeartHandshake,
  Home,
  Lightbulb,
  ListChecks,
  Moon,
  Play,
  RotateCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TrafficCone,
  Trophy,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import questionsData from "./data/questions.json";

type Question = {
  id: number;
  chapter: number;
  chapterTitle: string;
  question: string;
  options: string[];
  correctAnswer: number;
  images: string[];
  sourcePage: number;
};

type QuestionProgress = {
  attempts: number;
  correct: number;
  streak: number;
  mastered: boolean;
  lastSeen: number;
  nextReview: number;
};

type SessionMode = "learn" | "review" | "quick" | "test" | "single";

type ChapterMeta = {
  id: number;
  roman: string;
  title: string;
  shortTitle: string;
  count: number;
  icon: LucideIcon;
  color: string;
  tint: string;
};

const questions = questionsData as Question[];
const PROGRESS_KEY = "lai-vung-progress-v1";
const BOOKMARK_KEY = "lai-vung-bookmarks-v1";
const DAYS_KEY = "lai-vung-study-days-v1";
const THEME_KEY = "lai-vung-theme-v1";

const chapterMeta: ChapterMeta[] = [
  {
    id: 1,
    roman: "I",
    title: "Quy định chung và quy tắc giao thông đường bộ",
    shortTitle: "Quy tắc giao thông",
    count: 180,
    icon: BookOpen,
    color: "#0a6cff",
    tint: "#eaf3ff",
  },
  {
    id: 2,
    roman: "II",
    title: "Văn hóa giao thông, đạo đức người lái xe",
    shortTitle: "Văn hóa & đạo đức",
    count: 25,
    icon: HeartHandshake,
    color: "#7c5cff",
    tint: "#f0edff",
  },
  {
    id: 3,
    roman: "III",
    title: "Kỹ thuật lái xe",
    shortTitle: "Kỹ thuật lái xe",
    count: 58,
    icon: CarFront,
    color: "#009a73",
    tint: "#e5f7f1",
  },
  {
    id: 4,
    roman: "IV",
    title: "Cấu tạo và sửa chữa",
    shortTitle: "Cấu tạo & sửa chữa",
    count: 37,
    icon: Wrench,
    color: "#e57a00",
    tint: "#fff2df",
  },
  {
    id: 5,
    roman: "V",
    title: "Báo hiệu đường bộ",
    shortTitle: "Báo hiệu đường bộ",
    count: 185,
    icon: TrafficCone,
    color: "#e44355",
    tint: "#ffebee",
  },
  {
    id: 6,
    roman: "VI",
    title: "Giải thế sa hình và kỹ năng xử lý tình huống giao thông",
    shortTitle: "Sa hình & tình huống",
    count: 115,
    icon: Route,
    color: "#1778b9",
    tint: "#e7f4fb",
  },
];

function shuffle<T>(items: T[]) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStreak(days: string[]) {
  const completedDays = new Set(days);
  const cursor = new Date();
  let streak = 0;
  while (completedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function modeLabel(mode: SessionMode) {
  if (mode === "test") return "Thi thử 30 câu";
  if (mode === "review") return "Ôn câu cần nhớ";
  if (mode === "quick") return "Ôn nhanh 10 câu";
  if (mode === "single") return "Tra cứu câu hỏi";
  return "Học theo chương";
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function HomePage() {
  const [progress, setProgress] = useState<Record<number, QuestionProgress>>({});
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Question[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>("learn");
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, number>>({});
  const [answered, setAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryChapter, setLibraryChapter] = useState<number | null>(null);
  const [infoModal, setInfoModal] = useState<"tips" | "critical" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [testSecondsLeft, setTestSecondsLeft] = useState(20 * 60);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(PROGRESS_KEY);
      const storedBookmarks = localStorage.getItem(BOOKMARK_KEY);
      const storedDays = localStorage.getItem(DAYS_KEY);
      const storedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
      if (storedProgress) setProgress(JSON.parse(storedProgress));
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
      if (storedDays) setStudyDays(JSON.parse(storedDays));
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      // A corrupted local cache should never prevent the learning app from opening.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DAYS_KEY, JSON.stringify(studyDays));
  }, [studyDays, hydrated]);

  const activeQuestion = session[sessionIndex];
  const selectedAnswer = activeQuestion
    ? sessionAnswers[activeQuestion.id]
    : undefined;

  const summary = useMemo(() => {
    const values = Object.values(progress);
    const attempts = values.reduce((total, item) => total + item.attempts, 0);
    const correct = values.reduce((total, item) => total + item.correct, 0);
    const mastered = values.filter((item) => item.mastered).length;
    const needsReview = values.filter(
      (item) => item.attempts > item.correct || item.nextReview <= Date.now(),
    ).length;
    return {
      attempts,
      correct,
      mastered,
      needsReview,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      completion: Math.round((mastered / questions.length) * 100),
    };
  }, [progress]);

  const chapterProgress = useMemo(
    () =>
      chapterMeta.map((chapter) => {
        const chapterQuestions = questions.filter((item) => item.chapter === chapter.id);
        const mastered = chapterQuestions.filter((item) => progress[item.id]?.mastered).length;
        const attempted = chapterQuestions.filter((item) => progress[item.id]?.attempts).length;
        return {
          ...chapter,
          mastered,
          attempted,
          percent: Math.round((mastered / chapter.count) * 100),
        };
      }),
    [progress],
  );

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("vi");
    const chapterQuestions = libraryChapter
      ? questions.filter((question) => question.chapter === libraryChapter)
      : questions;
    if (!term) return !libraryChapter && bookmarks.length
      ? chapterQuestions.filter((question) => bookmarks.includes(question.id)).slice(0, 20)
      : chapterQuestions.slice(0, 30);
    const exactId = Number(term.replace(/[^0-9]/g, ""));
    return chapterQuestions
      .filter(
        (question) =>
          question.id === exactId ||
          question.question.toLocaleLowerCase("vi").includes(term),
      )
      .slice(0, 30);
  }, [searchTerm, bookmarks, libraryChapter]);

  const openLibrary = useCallback((chapter: number | null = null) => {
    setLibraryChapter(chapter);
    setSearchTerm("");
    setLibraryOpen(true);
  }, []);

  const recordStudyDay = useCallback(() => {
    const today = dateKey();
    setStudyDays((current) =>
      current.includes(today) ? current : [...current, today],
    );
  }, []);

  const applyAttempt = useCallback((question: Question, answer: number) => {
    const isCorrect = answer === question.correctAnswer;
    const now = Date.now();
    setProgress((current) => {
      const previous = current[question.id] ?? {
        attempts: 0,
        correct: 0,
        streak: 0,
        mastered: false,
        lastSeen: 0,
        nextReview: 0,
      };
      const streak = isCorrect ? previous.streak + 1 : 0;
      const delay = isCorrect
        ? [0, 1, 3, 7, 14][Math.min(streak, 4)] * 24 * 60 * 60 * 1000
        : 10 * 60 * 1000;
      return {
        ...current,
        [question.id]: {
          attempts: previous.attempts + 1,
          correct: previous.correct + (isCorrect ? 1 : 0),
          streak,
          mastered: streak >= 3,
          lastSeen: now,
          nextReview: now + delay,
        },
      };
    });
  }, []);

  const startSession = useCallback(
    (mode: SessionMode, chapter?: number, singleQuestion?: Question) => {
      let selected: Question[] = [];
      if (singleQuestion) {
        selected = [singleQuestion];
      } else if (mode === "test") {
        selected = shuffle(questions).slice(0, 30);
      } else {
        const pool = chapter
          ? questions.filter((question) => question.chapter === chapter)
          : questions;
        const prioritized = [...pool].sort((first, second) => {
          const firstProgress = progress[first.id];
          const secondProgress = progress[second.id];
          const firstPriority = firstProgress
            ? firstProgress.mastered
              ? 2
              : firstProgress.attempts > firstProgress.correct
                ? 0
                : 1
            : 0;
          const secondPriority = secondProgress
            ? secondProgress.mastered
              ? 2
              : secondProgress.attempts > secondProgress.correct
                ? 0
                : 1
            : 0;
          return firstPriority - secondPriority || first.id - second.id;
        });
        if (mode === "review") {
          const weak = prioritized.filter((question) => {
            const item = progress[question.id];
            return item && !item.mastered && item.attempts > item.correct;
          });
          selected = (weak.length ? weak : prioritized).slice(0, 15);
        } else {
          selected = prioritized.slice(0, mode === "quick" ? 10 : 15);
        }
      }
      setSession(selected);
      setSessionMode(mode);
      setSessionIndex(0);
      setSessionAnswers({});
      setAnswered(false);
      setShowResults(false);
      setLibraryOpen(false);
      if (mode === "test") setTestSecondsLeft(20 * 60);
    },
    [progress],
  );

  const chooseAnswer = useCallback(
    (answer: number) => {
      if (!activeQuestion) return;
      if (sessionMode !== "test" && answered) return;
      setSessionAnswers((current) => ({
        ...current,
        [activeQuestion.id]: answer,
      }));
      if (sessionMode !== "test") {
        setAnswered(true);
        applyAttempt(activeQuestion, answer);
        recordStudyDay();
      }
    },
    [activeQuestion, answered, applyAttempt, recordStudyDay, sessionMode],
  );

  const finishSession = useCallback(() => {
    if (sessionMode === "test") {
      session.forEach((question) => {
        const answer = sessionAnswers[question.id];
        if (answer !== undefined) applyAttempt(question, answer);
      });
      recordStudyDay();
    }
    setShowResults(true);
  }, [applyAttempt, recordStudyDay, session, sessionAnswers, sessionMode]);

  const goNext = useCallback(() => {
    if (!activeQuestion || selectedAnswer === undefined) return;
    if (sessionIndex === session.length - 1) {
      finishSession();
      return;
    }
    setSessionIndex((current) => current + 1);
    setAnswered(false);
  }, [activeQuestion, finishSession, selectedAnswer, session.length, sessionIndex]);

  useEffect(() => {
    if (sessionMode !== "test" || !activeQuestion || showResults) return;
    const timer = window.setInterval(() => {
      setTestSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionMode, activeQuestion, showResults]);

  useEffect(() => {
    if (sessionMode === "test" && activeQuestion && !showResults && testSecondsLeft === 0) {
      finishSession();
    }
  }, [activeQuestion, finishSession, sessionMode, showResults, testSecondsLeft]);

  useEffect(() => {
    if (!activeQuestion || showResults) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(event.key)) {
        const answer = Number(event.key) - 1;
        if (answer < activeQuestion.options.length) chooseAnswer(answer);
      }
      if (event.key === "Enter" && selectedAnswer !== undefined) goNext();
      if (event.key === "Escape") setSession([]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuestion, chooseAnswer, goNext, selectedAnswer, showResults]);

  const toggleBookmark = (questionId: number) => {
    setBookmarks((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const resultScore = session.filter(
    (question) => sessionAnswers[question.id] === question.correctAnswer,
  ).length;
  const resultPercent = session.length
    ? Math.round((resultScore / session.length) * 100)
    : 0;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" aria-label="Về trang tổng quan">
            <span className="brand-mark"><CarFront size={22} strokeWidth={2.2} /></span>
            <span>
              <strong>GPLX</strong>
              <small>Hạng B</small>
            </span>
          </button>

          <nav className="desktop-nav" aria-label="Điều hướng chính">
            <button className="nav-item active"><Home size={17} />Tổng quan</button>
            <button className="nav-item" onClick={() => startSession("review")}><RotateCcw size={17} />Ôn tập</button>
            <button className="nav-item" onClick={() => startSession("test")}><GraduationCap size={18} />Thi thử</button>
          </nav>

          <div className="topbar-actions">
            <button className="icon-button" onClick={() => openLibrary()} aria-label="Tìm câu hỏi"><Search size={19} /></button>
            <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Cài đặt"><Settings size={19} /></button>
            <div className="mini-progress" title={`${summary.completion}% đã thành thạo`}>
              <span style={{ "--mini-progress": `${summary.completion * 3.6}deg` } as React.CSSProperties}>
                {summary.completion}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="content-wrap">
        <section className="exam-summary" aria-label="Cấu trúc đề thi hạng B">
          <div className="exam-stat"><strong>30</strong><span>Câu hỏi/đề</span></div>
          <div className="exam-stat"><strong>20&apos;</strong><span>Thời gian</span></div>
          <div className="exam-stat"><strong>27/30</strong><span>Điểm đạt</span></div>
          <div className="exam-stat"><strong>600</strong><span>Tổng câu</span></div>
        </section>

        <section className="exam-hub" aria-label="Chức năng học và thi">
          <article className="exam-primary-card">
            <div className="exam-card-orb orb-one" />
            <div className="exam-card-orb orb-two" />
            <span className="exam-primary-icon"><GraduationCap size={27} /></span>
            <div>
              <span className="exam-kicker">MÔ PHỎNG ĐỀ HẠNG B</span>
              <h1>Thi thử Online</h1>
              <p>30 câu trong 20 phút, cần đúng tối thiểu 27 câu để đạt.</p>
            </div>
            <button onClick={() => startSession("test")}>
              Bắt đầu thi <ArrowRight size={18} />
            </button>
          </article>

          <div className="feature-grid">
            <button
              className="feature-card theory-card"
              onClick={() => document.getElementById("lo-trinh-600")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="feature-icon green"><BookOpen size={23} /></span>
              <span><strong>Học lý thuyết theo chương</strong><small>Học toàn bộ câu hỏi theo 6 chủ đề</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card sign-card" onClick={() => openLibrary(5)}>
              <span className="feature-icon orange"><TrafficCone size={23} /></span>
              <span><strong>Biển báo</strong><small>Tra cứu hệ thống biển báo giao thông</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card tips-card" onClick={() => setInfoModal("tips")}>
              <span className="feature-icon yellow"><Lightbulb size={23} /></span>
              <span><strong>Mẹo ghi nhớ</strong><small>Cách học nhanh, nhớ lâu và tránh học vẹt</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>

            <button className="feature-card critical-card" onClick={() => setInfoModal("critical")}>
              <span className="feature-icon red"><CircleAlert size={23} /></span>
              <span><strong>Câu điểm liệt</strong><small>60 câu hỏi cần đặc biệt lưu ý</small></span>
              <ChevronRight className="feature-arrow" size={18} />
            </button>
          </div>
        </section>

        <section className="section-block chapters-section" id="lo-trinh-600">
          <div className="section-heading">
            <div><span>Lộ trình 600 câu</span><h2>Học theo 6 chương</h2></div>
            <button className="text-button" onClick={() => openLibrary()}>Xem tất cả <ChevronRight size={16} /></button>
          </div>

          <div className="chapter-grid">
            {chapterProgress.map((chapter) => {
              const Icon = chapter.icon;
              return (
                <article className="chapter-card" key={chapter.id}>
                  <div className="chapter-card-top">
                    <span className="chapter-icon" style={{ color: chapter.color, background: chapter.tint }}><Icon size={22} /></span>
                    <span className="chapter-number">CHƯƠNG {chapter.roman}</span>
                    {chapter.percent === 100 && <span className="done-badge"><Check size={13} /> Xong</span>}
                  </div>
                  <h3>{chapter.title}</h3>
                  <div className="chapter-meta"><span>{chapter.count} câu hỏi</span><span>{chapter.percent}%</span></div>
                  <div className="chapter-progress"><span style={{ width: `${chapter.percent}%`, background: chapter.color }} /></div>
                  <button onClick={() => startSession("learn", chapter.id)}>
                    {chapter.attempted ? "Học tiếp chương này" : "Bắt đầu chương này"}
                    <ChevronRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="app-footer">
          <span><CarFront size={17} /> GPLX</span>
          <p>Dữ liệu được trích từ bộ 600 câu hỏi sát hạch lái xe cơ giới đường bộ 2025.</p>
        </footer>
      </div>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        <button className="active"><Home size={20} /><span>Tổng quan</span></button>
        <button onClick={() => startSession("review")}><RotateCcw size={20} /><span>Ôn tập</span></button>
        <button onClick={() => startSession("test")}><GraduationCap size={21} /><span>Thi thử</span></button>
        <button onClick={() => openLibrary()}><ListChecks size={20} /><span>600 câu</span></button>
      </nav>

      {activeQuestion && !showResults && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={modeLabel(sessionMode)}>
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setSession([])} />
          <section className="quiz-modal">
            <div className="quiz-progress-track"><span style={{ width: `${((sessionIndex + 1) / session.length) * 100}%` }} /></div>
            <header className="quiz-header">
              <button className="icon-button quiet" onClick={() => setSession([])} aria-label="Đóng phiên học"><X size={20} /></button>
              <div>
                <small>{modeLabel(sessionMode)}</small>
                <strong className={sessionMode === "test" ? "quiz-clock" : ""}>
                  {sessionMode === "test" && <><Clock3 size={13} /> {formatClock(testSecondsLeft)} · </>}
                  Câu {sessionIndex + 1} / {session.length}
                </strong>
              </div>
              <button
                className={`icon-button quiet ${bookmarks.includes(activeQuestion.id) ? "bookmarked" : ""}`}
                onClick={() => toggleBookmark(activeQuestion.id)}
                aria-label="Đánh dấu câu hỏi"
              >
                <Bookmark size={19} fill={bookmarks.includes(activeQuestion.id) ? "currentColor" : "none"} />
              </button>
            </header>

            <div className="quiz-body">
              <div className="question-kicker">
                <span>CÂU {activeQuestion.id}</span>
                <span>CHƯƠNG {chapterMeta[activeQuestion.chapter - 1].roman}</span>
              </div>
              <h2>{activeQuestion.question}</h2>

              {activeQuestion.images.length > 0 && (
                <div className={`question-images ${activeQuestion.images.length > 1 ? "multiple" : ""}`}>
                  {activeQuestion.images.map((image, index) => (
                    <img src={image} alt={`Hình minh họa câu ${activeQuestion.id}${index ? `, phần ${index + 1}` : ""}`} key={image} />
                  ))}
                </div>
              )}

              <div className="answer-list">
                {activeQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === activeQuestion.correctAnswer;
                  const reveal = sessionMode !== "test" && answered;
                  const answerClass = reveal
                    ? isCorrect
                      ? "correct"
                      : isSelected
                        ? "wrong"
                        : ""
                    : isSelected
                      ? "selected"
                      : "";
                  return (
                    <button
                      className={`answer-option ${answerClass}`}
                      key={`${activeQuestion.id}-${index}`}
                      onClick={() => chooseAnswer(index)}
                      disabled={sessionMode !== "test" && answered}
                    >
                      <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                      <span>{option}</span>
                      <span className="answer-state">
                        {reveal && isCorrect ? <Check size={18} /> : reveal && isSelected ? <X size={18} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {sessionMode !== "test" && answered && (
                <div className={`feedback-card ${selectedAnswer === activeQuestion.correctAnswer ? "success" : "error"}`} aria-live="polite">
                  {selectedAnswer === activeQuestion.correctAnswer ? <Check size={19} /> : <CircleAlert size={19} />}
                  <div>
                    <strong>{selectedAnswer === activeQuestion.correctAnswer ? "Chính xác!" : "Chưa đúng rồi."}</strong>
                    <span>Đáp án đúng là {String.fromCharCode(65 + activeQuestion.correctAnswer)}. Câu này sẽ được hệ thống xếp lịch ôn phù hợp.</span>
                  </div>
                </div>
              )}
            </div>

            <footer className="quiz-footer">
              <span className="keyboard-hint">Phím 1–4 để chọn · Enter để tiếp tục</span>
              <button className="primary-button quiz-next" onClick={goNext} disabled={selectedAnswer === undefined}>
                {sessionIndex === session.length - 1 ? (sessionMode === "test" ? "Nộp bài" : "Hoàn thành") : "Câu tiếp theo"}
                <ArrowRight size={18} />
              </button>
            </footer>
          </section>
        </div>
      )}

      {showResults && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Kết quả phiên học">
          <div className="modal-backdrop static" />
          <section className="result-modal">
            <div className="result-icon"><Trophy size={36} /></div>
            <span className="eyebrow centered">HOÀN THÀNH PHIÊN HỌC</span>
            <h2>
              {sessionMode === "test"
                ? resultScore >= 27 ? "Bạn đã đạt bài thi thử!" : "Chưa đạt, mình ôn lại nhé."
                : resultPercent >= 80 ? "Một phiên học rất tốt!" : "Mỗi lần ôn là một lần tiến bộ."}
            </h2>
            <p>
              Bạn trả lời đúng <strong>{resultScore}/{session.length} câu</strong>.
              {sessionMode === "test" ? " Mốc đạt của đề là 27/30 câu." : " Các câu chưa đúng đã được đưa vào lịch ôn."}
            </p>
            <div className="result-score"><strong>{resultPercent}%</strong><span>Độ chính xác</span></div>
            <div className="result-actions">
              <button className="secondary-button" onClick={() => { setShowResults(false); setSession([]); }}>Về tổng quan</button>
              <button className="primary-button" onClick={() => startSession("review")}><RotateCcw size={17} /> Ôn câu sai</button>
            </div>
          </section>
        </div>
      )}

      {libraryOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Thư viện 600 câu">
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setLibraryOpen(false)} />
          <section className="library-sheet">
            <header className="sheet-header">
              <div><small>THƯ VIỆN</small><h2>{libraryChapter === 5 ? "Tra cứu biển báo" : "Tra cứu 600 câu"}</h2></div>
              <button className="icon-button quiet" onClick={() => setLibraryOpen(false)} aria-label="Đóng"><X size={20} /></button>
            </header>
            <div className="search-box"><Search size={19} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nhập số câu hoặc nội dung…" /></div>
            {!libraryChapter && !searchTerm && bookmarks.length > 0 && <p className="sheet-note"><Bookmark size={14} /> Đang hiển thị các câu bạn đã đánh dấu</p>}
            <div className="question-list">
              {searchResults.map((question) => (
                <button key={question.id} onClick={() => startSession("single", undefined, question)}>
                  <span className="question-list-number">{question.id}</span>
                  <span><strong>{question.question}</strong><small>Chương {chapterMeta[question.chapter - 1].roman} · {question.options.length} lựa chọn</small></span>
                  {progress[question.id]?.mastered ? <Check className="mastered-check" size={17} /> : <ChevronRight size={17} />}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {infoModal && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={infoModal === "tips" ? "Mẹo ghi nhớ" : "Câu điểm liệt"}>
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setInfoModal(null)} />
          <section className="info-modal">
            <header className="sheet-header">
              <div>
                <small>{infoModal === "tips" ? "HỌC NHẸ, NHỚ LÂU" : "LƯU Ý QUAN TRỌNG"}</small>
                <h2>{infoModal === "tips" ? "Mẹo ghi nhớ" : "Câu điểm liệt"}</h2>
              </div>
              <button className="icon-button quiet" onClick={() => setInfoModal(null)} aria-label="Đóng"><X size={19} /></button>
            </header>
            {infoModal === "tips" ? (
              <div className="tips-list">
                <div><span>01</span><p><strong>Học từng chương nhỏ</strong>Đừng làm cả 600 câu một lượt. Hoàn thành từng nhóm 15 câu để giữ tập trung.</p></div>
                <div><span>02</span><p><strong>Ôn câu sai trước</strong>Câu trả lời sai sẽ được GPLX tự động đưa lên đầu phiên học sau.</p></div>
                <div><span>03</span><p><strong>Không học vị trí đáp án</strong>Hãy đọc lại câu hỏi và tự nói lý do trước khi xem đáp án đúng.</p></div>
                <div><span>04</span><p><strong>Lặp lại cách quãng</strong>Đúng liên tiếp 3 lần ở các phiên khác nhau mới được tính là thành thạo.</p></div>
              </div>
            ) : (
              <div className="critical-note">
                <span><CircleAlert size={26} /></span>
                <h3>Đang đối chiếu danh sách 60 câu</h3>
                <p>Tài liệu PDF xác nhận có 60 câu về tình huống mất an toàn nghiêm trọng nhưng không đánh dấu riêng từng câu. Mình chưa mở chế độ luyện để tránh gắn nhầm.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Cài đặt">
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setSettingsOpen(false)} />
          <section className="settings-popover">
            <header className="sheet-header"><div><small>TÙY CHỈNH</small><h2>Cài đặt</h2></div><button className="icon-button quiet" onClick={() => setSettingsOpen(false)}><X size={19} /></button></header>
            <button className="setting-row" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <span className="setting-icon">{theme === "light" ? <Moon size={19} /> : <Sun size={19} />}</span>
              <span><strong>Giao diện</strong><small>{theme === "light" ? "Chuyển sang nền tối" : "Chuyển sang nền sáng"}</small></span>
              <ChevronRight size={17} />
            </button>
            <div className="setting-row informational">
              <span className="setting-icon"><ShieldCheck size={19} /></span>
              <span><strong>Tiến độ riêng tư</strong><small>Dữ liệu chỉ lưu trên thiết bị này</small></span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
