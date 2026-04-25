import { useLang } from '../context/LangContext.jsx';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 800 }}>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="card animate-fade-in" style={{ padding: '32px 48px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 24, color: 'var(--text-primary)' }}>
          {t('terms.title')}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 8, color: 'var(--accent)' }}>
              {t('terms.section1')}
            </h2>
            <p className="text-secondary" style={{ lineHeight: 1.6 }}>
              {t('terms.content1')}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 8, color: 'var(--accent)' }}>
              {t('terms.section2')}
            </h2>
            <p className="text-secondary" style={{ lineHeight: 1.6 }}>
              {t('terms.content2')}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 8, color: 'var(--accent)' }}>
              {t('terms.section3')}
            </h2>
            <p className="text-secondary" style={{ lineHeight: 1.6 }}>
              {t('terms.content3')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
