import { useState, useEffect } from 'react';
import { STEPS } from './steps';
import { api } from '../../lib/api';
import { deriveMockStructure } from './data';
import type { ManuscriptSummary, FormattingProjectRecord, IngestSettings, DetectedItem } from './types';
import BinderySidebar from './components/BinderySidebar';
import LiveProofPanel from './components/LiveProofPanel';
import BringIn from './components/BringIn';
import MarkUp from './components/MarkUp';
import styles from './Formatter.module.css';

export type Device = 'paperwhite' | 'phone' | 'tablet';

export default function FormatterHub() {
  const [activeStep,           setActiveStep]           = useState(1);
  const [device,               setDevice]               = useState<Device>('paperwhite');
  const [manuscripts,          setManuscripts]          = useState<ManuscriptSummary[]>([]);
  const [selectedManuscriptId, setSelectedManuscriptId] = useState<string | null>(null);
  const [project,              setProject]              = useState<FormattingProjectRecord | null>(null);
  const [projectLoading,       setProjectLoading]       = useState(false);
  const [structureItems,       setStructureItems]       = useState<DetectedItem[]>([]);

  // Fetch manuscripts on mount; auto-select most recently updated
  useEffect(() => {
    api.get<ManuscriptSummary[]>('/api/manuscripts')
      .then(data => {
        setManuscripts(data);
        if (data.length > 0) {
          const latest = [...data].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          setSelectedManuscriptId(latest.id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch any existing FormattingProject when the selected manuscript changes
  useEffect(() => {
    if (!selectedManuscriptId) return;
    setProjectLoading(true);
    setProject(null);
    setStructureItems([]);
    api.get<FormattingProjectRecord>(`/api/formatter/${selectedManuscriptId}`)
      .then(data => setProject(data))
      .catch(() => setProject(null))
      .finally(() => setProjectLoading(false));
  }, [selectedManuscriptId]);

  // Derive mock structure whenever the selected manuscript or project changes
  useEffect(() => {
    const ms = manuscripts.find(m => m.id === selectedManuscriptId);
    if (ms) setStructureItems(deriveMockStructure(ms));
  }, [selectedManuscriptId, manuscripts]);

  async function handlePull(manuscriptId: string, settings: IngestSettings) {
    const created = await api.post<FormattingProjectRecord>('/api/formatter', {
      manuscriptId,
      source:      'EDITOR',
      encoding:    settings.encoding.toUpperCase(),
      smartQuotes: settings.smartQuotes.toUpperCase(),
    });
    setProject(created);
    api.get<ManuscriptSummary[]>('/api/manuscripts')
      .then(data => setManuscripts(data))
      .catch(() => {});
  }

  async function handleUpload(file: File, settings: IngestSettings) {
    let proj = project;
    if (!proj && selectedManuscriptId) {
      proj = await api.post<FormattingProjectRecord>('/api/formatter', {
        manuscriptId: selectedManuscriptId,
        encoding:     settings.encoding.toUpperCase(),
        smartQuotes:  settings.smartQuotes.toUpperCase(),
      });
      setProject(proj);
    }
    if (!proj) return;
    const form = new FormData();
    form.append('docx', file);
    const updated = await api.upload<FormattingProjectRecord>(
      `/api/formatter/${proj.id}/upload`, form
    );
    setProject(updated);
  }

  async function handlePasteSubmit(text: string, settings: IngestSettings) {
    if (!selectedManuscriptId) return;
    if (!project) {
      const created = await api.post<FormattingProjectRecord>('/api/formatter', {
        manuscriptId:  selectedManuscriptId,
        source:        'PASTE',
        encoding:      settings.encoding.toUpperCase(),
        smartQuotes:   settings.smartQuotes.toUpperCase(),
        pastedContent: text,
      });
      setProject(created);
    } else {
      const updated = await api.patch<FormattingProjectRecord>(
        `/api/formatter/${project.id}`,
        { source: 'PASTE', pastedContent: text }
      );
      setProject(updated);
    }
  }

  async function handleSettingsChange(settings: Partial<IngestSettings>) {
    if (!project) return;
    try {
      const updated = await api.patch<FormattingProjectRecord>(
        `/api/formatter/${project.id}`,
        {
          encoding:    settings.encoding?.toUpperCase(),
          smartQuotes: settings.smartQuotes?.toUpperCase(),
        }
      );
      setProject(updated);
    } catch {
      // Non-critical — local state already updated in BringIn
    }
  }

  const selectedManuscript = manuscripts.find(m => m.id === selectedManuscriptId) ?? null;
  const step = STEPS.find(s => s.n === activeStep)!;
  const nn   = String(activeStep).padStart(2, '0');

  return (
    <div className={styles.root}>
      <div className={styles.breadcrumb}>
        <span className={`mono ${styles.breadcrumbPath}`}>
          § STEP {nn} · {step.breadcrumbName} · {step.breadcrumbDesc} · {nn} / 07
        </span>
        <span className={`mono ${styles.breadcrumbManuscript}`}>
          {selectedManuscript
            ? `MANUSCRIPT  ${selectedManuscript.title}  ${selectedManuscript.wordCount.toLocaleString()}W`
            : 'MANUSCRIPT  —'}
        </span>
      </div>

      <div className={styles.columns}>
        <BinderySidebar activeStep={activeStep} onStepChange={setActiveStep} />

        <main className={styles.content}>
          {activeStep === 1 && (
            <BringIn
              manuscripts={manuscripts}
              selectedManuscriptId={selectedManuscriptId}
              onManuscriptSelect={setSelectedManuscriptId}
              project={project}
              projectLoading={projectLoading}
              onPull={handlePull}
              onUpload={handleUpload}
              onPasteSubmit={handlePasteSubmit}
              onSettingsChange={handleSettingsChange}
              onAdvance={() => setActiveStep(2)}
            />
          )}
          {activeStep === 2 && (
            <MarkUp
              project={project}
              items={structureItems}
              onItemsChange={setStructureItems}
              onBack={() => setActiveStep(1)}
              onAdvance={() => setActiveStep(3)}
            />
          )}
        </main>

        <LiveProofPanel
          device={device}
          onDeviceChange={setDevice}
          activeStep={activeStep}
          structureItems={structureItems}
        />
      </div>
    </div>
  );
}
