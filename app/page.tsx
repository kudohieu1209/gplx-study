"use client";

import {
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Brain,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Flame,
  GraduationCap,
  HeartHandshake,
  Home,
  ListChecks,
  Moon,
  Play,
  RotateCcw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const nextChapter =
    chapterProgress.find((chapter) => chapter.percent < 100) ?? chapterProgress[0];

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("vi");
    if (!term) return bookmarks.length
      ? questions.filter((question) => bookmarks.includes(question.id)).slice(0, 20)
      : questions.slice(0, 20);
    const exactId = Number(term.replace(/[^0-9]/g, ""));
    return questions
      .filter(
        (question) =>
          question.id === exactId ||
          question.question.toLocaleLowerCase("vi").includes(term),
      )
      .slice(0, 30);
  }, [searchTerm, bookmarks]);

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
              <strong>Lái Vững</strong>
              <small>600 câu hạng B</small>
            </span>
          </button>

          <nav className="desktop-nav" aria-label="Điều hướng chính">
            <button className="nav-item active"><Home size={17} />Tổng quan</button>
            <button className="nav-item" onClick={() => startSession("review")}><RotateCcw size={17} />Ôn tập</button>
            <button className="nav-item" onClick={() => startSession("test")}><GraduationCap size={18} />Thi thử</button>
          </nav>

          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setLibraryOpen(true)} aria-label="Tìm câu hỏi"><Search size={19} /></button>
            <button className="icon-button desktop-only" aria-label="Thông báo"><Bell size={19} /></button>
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
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> Lộ trình thông minh</span>
            <h1>Mỗi ngày vững hơn<br />một chặng đường.</h1>
            <p>
              Hệ thống tự ưu tiên câu chưa học và câu bạn từng trả lời sai.
              Chỉ cần đều đặn 15 phút mỗi ngày.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => startSession("learn", nextChapter.id)}>
                <Play size={17} fill="currentColor" />
                {summary.attempts ? "Học tiếp" : "Bắt đầu học"}
              </button>
              <button className="secondary-button" onClick={() => setLibraryOpen(true)}>
                Xem 600 câu <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <div className="hero-progress-wrap">
            <div
              className="hero-progress"
              style={{ "--progress": `${summary.completion * 3.6}deg` } as React.CSSProperties}
            >
              <div className="hero-progress-inner">
                <strong>{summary.completion}%</strong>
                <span>đã thành thạo</span>
              </div>
            </div>
            <div className="hero-progress-caption">
              <ShieldCheck size={18} />
              <span><strong>{summary.mastered}/600 câu</strong><small>Đang tiến bộ đúng hướng</small></span>
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Thống kê học tập">
          <article className="stat-card">
            <span className="stat-icon blue"><Target size={20} /></span>
            <div><small>Đã làm</small><strong>{summary.attempts}</strong><span>lượt trả lời</span></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon green"><BarChart3 size={20} /></span>
            <div><small>Độ chính xác</small><strong>{summary.accuracy}%</strong><span>{summary.correct} câu đúng</span></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon orange"><Flame size={20} /></span>
            <div><small>Chuỗi học</small><strong>{calculateStreak(studyDays)}</strong><span>ngày liên tiếp</span></div>
          </article>
          <article className="stat-card">
            <span className="stat-icon purple"><Brain size={20} /></span>
            <div><small>Cần ôn lại</small><strong>{summary.needsReview}</strong><span>câu đang chờ</span></div>
          </article>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div><span>Gợi ý cho bạn</span><h2>Tiếp tục hành trình</h2></div>
          </div>
          <div className="continue-grid">
            <article className="continue-card primary-continue">
              <div className="continue-glow" />
              <div className="continue-content">
                <span className="continue-kicker">ĐANG HỌC · CHƯƠNG {nextChapter.roman}</span>
                <h3>{nextChapter.shortTitle}</h3>
                <p>{nextChapter.attempted}/{nextChapter.count} câu đã xem · {nextChapter.mastered} câu thành thạo</p>
                <div className="light-progress"><span style={{ width: `${Math.max(3, nextChapter.percent)}%` }} /></div>
                <button onClick={() => startSession("learn", nextChapter.id)}>
                  Tiếp tục học <ChevronRight size={18} />
                </button>
              </div>
              <nextChapter.icon className="continue-illustration" strokeWidth={1.25} />
            </article>

            <article className="continue-card quick-continue">
              <div className="quick-icon"><Clock3 size={25} /></div>
              <div>
                <span className="continue-kicker dark">PHIÊN NGẮN · 5–7 PHÚT</span>
                <h3>Ôn nhanh 10 câu</h3>
                <p>Ưu tiên câu sai và câu sắp đến hạn ôn.</p>
              </div>
              <button className="round-arrow" onClick={() => startSession("quick")} aria-label="Bắt đầu ôn nhanh"><ArrowRight size={20} /></button>
            </article>
          </div>
        </section>

        <section className="section-block chapters-section">
          <div className="section-heading">
            <div><span>Lộ trình 600 câu</span><h2>Học theo 6 chương</h2></div>
            <button className="text-button" onClick={() => setLibraryOpen(true)}>Xem tất cả <ChevronRight size={16} /></button>
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

        <section className="test-banner">
          <div className="test-banner-icon"><Trophy size={28} /></div>
          <div><span>SẴN SÀNG KIỂM TRA?</span><h2>Thi thử 30 câu ngẫu nhiên</h2><p>Làm liền mạch, xem kết quả và các câu sai sau khi nộp bài.</p></div>
          <button onClick={() => startSession("test")}>Bắt đầu thi <ArrowRight size={18} /></button>
        </section>

        <footer className="app-footer">
          <span><CarFront size={17} /> Lái Vững</span>
          <p>Dữ liệu được trích từ bộ 600 câu hỏi sát hạch lái xe cơ giới đường bộ 2025.</p>
        </footer>
      </div>

      <nav className="mobile-nav" aria-label="Điều hướng di động">
        <button className="active"><Home size={20} /><span>Tổng quan</span></button>
        <button onClick={() => startSession("review")}><RotateCcw size={20} /><span>Ôn tập</span></button>
        <button onClick={() => startSession("test")}><GraduationCap size={21} /><span>Thi thử</span></button>
        <button onClick={() => setLibraryOpen(true)}><ListChecks size={20} /><span>600 câu</span></button>
      </nav>

      {activeQuestion && !showResults && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={modeLabel(sessionMode)}>
          <button className="modal-backdrop" aria-label="Đóng" onClick={() => setSession([])} />
          <section className="quiz-modal">
            <div className="quiz-progress-track"><span style={{ width: `${((sessionIndex + 1) / session.length) * 100}%` }} /></div>
            <header className="quiz-header">
              <button className="icon-button quiet" onClick={() => setSession([])} aria-label="Đóng phiên học"><X size={20} /></button>
              <div><small>{modeLabel(sessionMode)}</small><strong>Câu {sessionIndex + 1} / {session.length}</strong></div>
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
            <h2>{resultPercent >= 80 ? "Một phiên học rất tốt!" : "Mỗi lần ôn là một lần tiến bộ."}</h2>
            <p>Bạn trả lời đúng <strong>{resultScore}/{session.length} câu</strong>. Các câu chưa đúng đã được đưa vào lịch ôn.</p>
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
              <div><small>THƯ VIỆN</small><h2>Tra cứu 600 câu</h2></div>
              <button className="icon-button quiet" onClick={() => setLibraryOpen(false)} aria-label="Đóng"><X size={20} /></button>
            </header>
            <div className="search-box"><Search size={19} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nhập số câu hoặc nội dung…" /></div>
            {!searchTerm && bookmarks.length > 0 && <p className="sheet-note"><Bookmark size={14} /> Đang hiển thị các câu bạn đã đánh dấu</p>}
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
