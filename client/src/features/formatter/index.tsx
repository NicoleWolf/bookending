import { useState, useEffect } from 'react';
import { STEPS } from './steps';
import { api } from '../../lib/api';
import { deriveMockStructure } from './data';
import type { ManuscriptSummary, FormattingProjectRecord, IngestSettings, DetectedItem, FrontMatterState, SetTypeState, FontSize, BackMatterState, ProfileSnapshot, CoverPressState } from './types';
import { buildDefaultFrontMatter, buildDefaultTypeSettings, buildDefaultBackMatter, buildDefaultCoverPress } from './types';
import BinderySidebar from './components/BinderySidebar';
import LiveProofPanel from './components/LiveProofPanel';
import BringIn from './components/BringIn';
import MarkUp from './components/MarkUp';
import FrontMatter from './components/FrontMatter';
import SetTheType from './components/SetTheType';
import Proof from './components/Proof';
import BackMatter from './components/BackMatter';
import CoverPress from './components/CoverPress';
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
  const [frontMatterState,     setFrontMatterState]     = useState<FrontMatterState | null>(null);
  const [typeSettingsState,    setTypeSettingsState]    = useState<SetTypeState>(buildDefaultTypeSettings(null));
  const [fontSize,             setFontSize]             = useState<FontSize>('M');
  const [jumpChapter,          setJumpChapter]          = useState(0);
  const [authorProfile,        setAuthorProfile]        = useState<ProfileSnapshot | null>(null);
  const [backMatterState,      setBackMatterState]      = useState<BackMatterState | null>(null);
  const [coverPressState,      setCoverPressState]      = useState<CoverPressState>(buildDefaultCoverPress(null));

  // Fetch author profile on mount for back matter pre-fill
  useEffect(() => {
    api.get<{
      id: string; name: string; bio: string | null; location: string | null;
      avatarUrl: string | null; manuscripts: { id: string; title: string }[];
    }>('/api/author-profile')
      .then(data => {
        setAuthorProfile({
          name:        data.name,
          location:    data.location,
          bio:         data.bio,
          avatarUrl:   data.avatarUrl,
          otherTitles: data.manuscripts.map(m => ({ id: m.id, title: m.title })),
          syncedAt:    new Date().toISOString(),
        });
      })
      .catch(() => {});
  }, []);

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

  // Build (or re-sync) front matter state when manuscript or saved project changes
  useEffect(() => {
    const ms = manuscripts.find(m => m.id === selectedManuscriptId);
    if (!ms) return;
    const authorName = 'Author'; // placeholder until author profile is threaded through
    setFrontMatterState(
      buildDefaultFrontMatter(ms.title, authorName, project?.frontMatter ?? null)
    );
  }, [selectedManuscriptId, manuscripts, project?.frontMatter]);

  // Re-sync type settings when project loads
  useEffect(() => {
    setTypeSettingsState(buildDefaultTypeSettings(project?.typeSettings ?? null));
  }, [project?.typeSettings]);

  // Re-sync cover press when project loads
  useEffect(() => {
    setCoverPressState(buildDefaultCoverPress(project?.coverPress ?? null));
  }, [project?.coverPress]);

  // Re-sync back matter when project or profile changes
  useEffect(() => {
    const ms = manuscripts.find(m => m.id === selectedManuscriptId);
    // Filter out the current manuscript from the "also by" list
    const profile = authorProfile
      ? { ...authorProfile, otherTitles: authorProfile.otherTitles.filter(t => t.id !== selectedManuscriptId) }
      : null;
    setBackMatterState(
      buildDefaultBackMatter(profile, ms?.title ?? 'Untitled', project?.backMatter ?? null)
    );
  }, [selectedManuscriptId, manuscripts, authorProfile, project?.backMatter]);

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
          {activeStep === 3 && frontMatterState && (
            <FrontMatter
              project={project}
              state={frontMatterState}
              onStateChange={setFrontMatterState}
              onBack={() => setActiveStep(2)}
              onAdvance={() => setActiveStep(4)}
            />
          )}
          {activeStep === 4 && (
            <SetTheType
              project={project}
              state={typeSettingsState}
              onStateChange={setTypeSettingsState}
              onBack={() => setActiveStep(3)}
              onAdvance={() => setActiveStep(5)}
            />
          )}
          {activeStep === 6 && backMatterState && (
            <BackMatter
              project={project}
              state={backMatterState}
              onStateChange={setBackMatterState}
              profile={authorProfile}
              onBack={() => setActiveStep(5)}
              onAdvance={() => setActiveStep(7)}
            />
          )}
          {activeStep === 7 && (
            <CoverPress
              project={project}
              state={coverPressState}
              onStateChange={setCoverPressState}
              onBack={() => setActiveStep(6)}
            />
          )}
          {activeStep === 5 && (
            <Proof
              project={project}
              structureItems={structureItems}
              frontMatterState={frontMatterState}
              typeSettingsState={typeSettingsState}
              device={device}
              onDeviceChange={setDevice}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              jumpChapter={jumpChapter}
              onJumpChapter={setJumpChapter}
              onGoToStep={setActiveStep}
              onBack={() => setActiveStep(4)}
              onAdvance={() => setActiveStep(6)}
            />
          )}
        </main>

        <LiveProofPanel
          device={device}
          onDeviceChange={setDevice}
          activeStep={activeStep}
          structureItems={structureItems}
          frontMatterState={frontMatterState ?? undefined}
          typeSettingsState={typeSettingsState}
          backMatterState={backMatterState ?? undefined}
          coverPressState={coverPressState}
          profile={authorProfile}
          fontSize={fontSize}
          jumpChapter={jumpChapter}
          hideDeviceToggle={activeStep === 5}
        />
      </div>
    </div>
  );
}
