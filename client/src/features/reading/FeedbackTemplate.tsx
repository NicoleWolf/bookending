import { FEEDBACK_TEMPLATE } from './data';
import type { TemplateAnswers } from './data';
import styles from './FeedbackTemplate.module.css';

interface Props {
  answers:  TemplateAnswers;
  onChange: (next: TemplateAnswers) => void;
}

export default function FeedbackTemplate({ answers, onChange }: Props) {
  function setScale(promptId: string, value: number) {
    onChange({ ...answers, [promptId]: value });
  }

  function setText(promptId: string, value: string) {
    onChange({ ...answers, [promptId]: value });
  }

  return (
    <div className={styles.template}>
      <div className={`label ${styles.templateLabel}`}>
        Structured feedback — answer any or all
      </div>

      {FEEDBACK_TEMPLATE.map((cat, catIdx) => (
        <div key={cat.id} className={styles.category}>
          <div className={styles.catHead}>
            <span className={`label ${styles.catNum}`}>0{catIdx + 1}</span>
            <span className={`serif ${styles.catLabel}`}>{cat.label}</span>
          </div>

          {cat.prompts.map(prompt => (
            <div key={prompt.id} className={styles.prompt}>
              <div className={styles.promptText}>{prompt.text}</div>

              {prompt.type === 'scale' && prompt.scale && (
                <div
                  className={styles.scaleRow}
                  role="radiogroup"
                  aria-label={prompt.text}
                  onKeyDown={e => {
                    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                    e.preventDefault();
                    const len = prompt.scale!.length;
                    const cur = answers[prompt.id] as number | undefined;
                    const next = cur === undefined
                      ? (e.key === 'ArrowRight' ? 1 : len)
                      : e.key === 'ArrowRight'
                        ? Math.min(cur + 1, len)
                        : Math.max(cur - 1, 1);
                    setScale(prompt.id, next);
                    const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
                    btns[next - 1]?.focus();
                  }}
                >
                  {prompt.scale.map((label, i) => {
                    const value    = i + 1;
                    const selected = answers[prompt.id] === value;
                    const curVal   = answers[prompt.id] as number | undefined;
                    const isTabStop = curVal !== undefined ? selected : i === 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={styles.scaleBtn}
                        data-selected={selected ? '' : undefined}
                        tabIndex={isTabStop ? 0 : -1}
                        onClick={() => setScale(prompt.id, value)}
                      >
                        <span className={styles.scaleMark} aria-hidden="true">
                          {selected ? '◉' : '◎'}
                        </span>
                        <span className={styles.scaleLabel}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {prompt.type === 'text' && (
                <textarea
                  className={styles.textArea}
                  placeholder="Optional — skip if nothing comes to mind."
                  value={typeof answers[prompt.id] === 'string' ? (answers[prompt.id] as string) : ''}
                  onChange={e => setText(prompt.id, e.target.value)}
                  rows={2}
                  maxLength={800}
                  aria-label={prompt.text}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
