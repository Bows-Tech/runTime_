import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">runtime_</p>
        <h1>{dict.auth.titulo}</h1>
        <p style={{ marginBottom: 28 }}>{dict.auth.subtitulo}</p>
        <LoginForm
          labels={{
            email: dict.auth.email,
            password: dict.auth.password,
            entrar: dict.auth.entrar,
            error: dict.auth.error,
          }}
          redirectTo="/admin"
          locale={locale}
        />
      </div>
    </section>
  );
}
