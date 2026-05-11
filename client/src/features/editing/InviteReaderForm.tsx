import { useState } from 'react';
import { Btn } from '../../shared/ui/atoms';
import styles from './InviteReaderForm.module.css';

interface InviteReaderFormProps {
  onInvite: (name: string, email: string) => void;
  onCancel: () => void;
}

export function InviteReaderForm({ onInvite, onCancel }: InviteReaderFormProps) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onInvite(name.trim(), email.trim());
    setName('');
    setEmail('');
  };

  return (
    <div className={styles.form}>
      <div className="label">Invite a reader</div>
      <div className={styles.inputs}>
        <input
          className={styles.input}
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <input
          className={styles.input}
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <div className={styles.btns}>
        <Btn tone="primary" onClick={submit}>Send invite</Btn>
        <Btn tone="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}
