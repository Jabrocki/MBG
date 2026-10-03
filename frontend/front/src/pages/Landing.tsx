import { useState } from 'react'
import { illustrations, innovations, needs } from '../data'
import { ButtonLink, Icon, Link, Logo } from '../ui'
import AnimatedContent from '../components/react-bits/AnimatedContent'
import CountUp from '../components/react-bits/CountUp'

export default function Landing() {
  const [menu, setMenu] = useState(false)
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Nawigacja strony głównej" className={menu ? 'open' : ''}>
          <a href="#inicjatywa" onClick={() => setMenu(false)}>
            O projekcie
          </a>
          <Link href="/logowanie?cel=innowacje">Innowacje</Link>
          <Link href="/logowanie?cel=mapa">Mapa potrzeb</Link>
          <a href="#proces" onClick={() => setMenu(false)}>
            Jak to działa?
          </a>
        </nav>
        <div>
          <Link className="landing-login" href="/logowanie">
            Zaloguj się
          </Link>
          <ButtonLink to="/logowanie">Wypróbuj MBG</ButtonLink>
          <button
            className="icon-button landing-menu"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-label="Menu strony głównej"
          >
            <Icon name="List" />
          </button>
        </div>
      </header>
      <section className="landing-hero cartoon-hero">
        <AnimatedContent
          className="cartoon-art-reveal"
          distance={35}
          direction="horizontal"
          duration={1.1}
          initialOpacity={0.5}
        >
          <img
            className="cartoon-hero-art"
            src="/images/małopolska-hero.webp"
            fetchPriority="high"
            alt="Rysunkowi mieszkańcy Małopolski rozmawiają nad Wisłą. W tle panorama Krakowa i zielone wzgórza."
          />
        </AnimatedContent>
        <AnimatedContent
          distance={28}
          duration={0.85}
          initialOpacity={0.65}
          className="cartoon-hero-copy"
        >
          <h1 tabIndex={-1}>
            Razem
            <br />
            znajdujemy
            <br />
            <span>rozwiązania.</span>
            <svg className="hero-spark" viewBox="0 0 48 60" aria-hidden="true">
              <path
                d="m8 12 7 10M27 7l-2 13M35 31l-12 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <div className="hero-intro">
            <p>
              Zgłaszaj wyzwania społeczne, odkrywaj istniejące innowacje, rozwijaj własne pomysły i
              wspieraj inicjatywy w Małopolsce.
            </p>
            <div className="hero-actions">
              <ButtonLink to="/logowanie?cel=zgloszenie">Zgłoś problem</ButtonLink>
              <ButtonLink to="/logowanie?cel=innowacje" secondary>
                Poznaj innowacje
              </ButtonLink>
            </div>
          </div>
        </AnimatedContent>
        <AnimatedContent distance={18} delay={0.35} duration={0.7} className="hero-stats-wrap">
          <div className="hero-stats" aria-label="Zawartość wersji demonstracyjnej">
            {[
              [innovations.length, 'innowacje w bibliotece', 'Books'],
              [needs.length, 'przykładowe potrzeby', 'MapPin'],
              [2, 'konta demonstracyjne', 'Users'],
              [1, 'przykładowy pilotaż', 'Plant'],
            ].map(([count, label, icon]) => (
              <div key={String(label)}>
                <span className="stat-icon">
                  <Icon name={icon as 'Books'} size={24} />
                </span>
                <div>
                  <strong>
                    <CountUp to={Number(count)} duration={1.4} />
                    <span className="sr-only">{count}</span>
                  </strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
          <small className="hero-demo-label">Dane demonstracyjne · poznaj możliwości MBG</small>
        </AnimatedContent>
      </section>
      <section className="intro-section" id="inicjatywa">
        <h2>
          Dobre rozwiązania
          <br />
          zaczynają się od słuchania.
        </h2>
        <div>
          <p>
            Nie każdy problem wymaga wymyślania wszystkiego od początku. Istnieją narzędzia, metody
            i pomysły, które mogą pomóc — jeśli trafią do właściwych osób.
          </p>
          <p>
            MBG pomaga opisać potrzebę, odnaleźć istniejące innowacje i rozważyć ich lokalne
            zastosowanie. Gdy brakuje odpowiedzi, jest miejsce na nowy pomysł i wspólne działanie.
          </p>
          <span className="inline-note">
            <Icon name="ShieldCheck" />
            Źródła, ograniczenia i decyzje pozostają widoczne.
          </span>
        </div>
      </section>
      <section className="process-section" id="proces">
        <div className="section-heading">
          <h2>
            Od potrzeby
            <br />
            do możliwego rozwiązania.
          </h2>
          <p>
            Ty znasz swoją codzienność.
            <br />
            My pomagamy znaleźć punkt zaczepienia.
          </p>
        </div>
        <ol className="process-list">
          <li>
            <span>1</span>
            <div>
              <h3>Powiedz, czego brakuje.</h3>
              <p>
                Opisz sprawę i wskaż miejsce w Małopolsce. Możesz zgłosić potrzebę swojej rodziny,
                sąsiadów lub organizacji.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <h3>Sprawdź podpowiedzi.</h3>
              <p>
                Skoryguj kategorie i potwierdź, czy podobna potrzeba dotyczy Twojej sprawy. Decyzja
                należy do Ciebie.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <h3>Znajdź sposób na zmianę.</h3>
              <p>
                Poznaj trafne innowacje ze źródłami i ograniczeniami. Rozważ adaptację, rozwijaj
                pomysł lub dołącz do pilotażu.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section className="people-section" id="dla-kogo">
        <figure>
          <img
            src={illustrations.people}
            loading="lazy"
            alt="Rysunkowi mieszkańcy wspólnie rozmawiają nad Wisłą."
          />
          <figcaption>Każda perspektywa ma znaczenie. Ilustracja inicjatywy.</figcaption>
        </figure>
        <div>
          <h2>
            Jest tu miejsce
            <br />
            na Twoją perspektywę.
          </h2>
          <div className="audience-row">
            <Icon name="Users" size={26} />
            <div>
              <h3>Dla mieszkańców</h3>
              <p>
                Zgłoś potrzebę, poznaj pomysły i wesprzyj propozycję, która ma znaczenie w Twojej
                okolicy.
              </p>
            </div>
          </div>
          <div className="audience-row">
            <Icon name="House" size={26} />
            <div>
              <h3>Dla organizacji i instytucji</h3>
              <p>
                Znajdź istniejącą innowację i przygotuj jej adaptację do odbiorców, zasobów i
                warunków swojej placówki.
              </p>
            </div>
          </div>
          <ButtonLink to="/logowanie" secondary>
            Poznaj aplikację
          </ButtonLink>
        </div>
      </section>
      <section className="faq-section">
        <h2>Na początek warto wiedzieć.</h2>
        <div>
          {[
            [
              'Czy to jest gotowa usługa?',
              'Wybrane profile i sprawy są przykładowe. Zobacz, jak mieszkańcy mogą zgłaszać potrzeby i wspólnie rozwijać rozwiązania.',
            ],
            [
              'Czy trzeba mieć gotowy pomysł?',
              'Nie. Zacznij od potrzeby. Najpierw warto poznać istniejące rozwiązania; nowy pomysł jest kolejną możliwością.',
            ],
            [
              'Czy AI podejmuje decyzje?',
              'AI ma wspierać porządkowanie i redakcję treści. Powiązanie potrzeby potwierdza użytkownik, a publikację i start pilotażu zatwierdza administrator.',
            ],
            [
              'Czy wsparcie oznacza wpłatę?',
              'Nie. Prototyp obejmuje poparcie oraz deklaracje czasu, sprzętu, lokalu i budżetu. Nie przyjmuje płatności.',
            ],
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Icon name="Plus" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="landing-cta">
        <h2>
          Zacznij od sprawy,
          <br />
          która jest Ci bliska.
        </h2>
        <div>
          <p>
            Jedna potrzeba może być
            <br />
            początkiem wspólnej zmiany.
          </p>
          <ButtonLink to="/logowanie">Przejdź do aplikacji</ButtonLink>
        </div>
      </section>
      <footer className="landing-footer">
        <Logo />
        <span>Wspólna przestrzeń dla Małopolski.</span>
        <a href="#inicjatywa">O inicjatywie</a>
        <div className="footer-monogram" aria-hidden="true">
          MBG<span>bez granic.</span>
        </div>
      </footer>
    </div>
  )
}
