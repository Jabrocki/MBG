# Prompty mockupów HUBMI

Narzędzie: wbudowane ImageGen. Kolejność: desktop, adaptacja mobilna z desktopu, jedna korekta mobilna. Finalne pliki: desktop.png i mobile.png.

## Desktop

```text
Use case: ui-mockup. Create a high fidelity, polished, realistic product design mockup of the DESKTOP authenticated home page /start of HUBMI, a Polish civic social innovation application. One single landscape desktop screen, flat front-facing screenshot, approximately 1600x1100 proportions, no physical device, no perspective, no browser chrome, no presentation-board decorations. This is an operational citizen dashboard, not a marketing landing page.

Product: citizens describe a social problem, confirm related needs and find existing source-backed innovations. Demo logged-in citizen only; do not show an administrator or official role. All example needs and counts below are synthetic, clearly label the entire view "Dane demo".

Established Friendly Civic Tech visual system: warm ivory background #FAF8F3, white surfaces #FFFFFF, deep forest text #172B26, muted text #52645B, primary deep green #146B52 with white text, sparse rust orange #B84A1B accents, subtle mint #E7F2EC, quiet border #D5DDD6. Source Sans 3 style sans-serif with complete Polish diacritics, body approximately 16px, titles 32px, metadata 14px. Elegant restrained spacing in 8px increments, buttons 8px radius, cards 12px. Distinctive calm civic service with generous usable whitespace, light hairline separators, extremely subtle shadows, consistent small thin outline icons. No garish gradients, glass, emoji, decorative 3D, massive promotional type or meaningless KPI metrics. No card nesting.

Composition, exact text:
1. White slim top navigation: wordmark "HUBMI" on left (simple typography only); nav "Start" (active with green underline), "Potrzeby", "Innowacje", "Pomysły", "Pilotaże". On right notification bell, text "Moje aktywności", small neutral "Konto demo" control. Ensure nav fits on one line.
2. Main content centered with broad margins and max width around 1240px. Heading "Dzień dobry!" and muted subtitle "Co możemy zmienić w Twojej okolicy?" Location selector on the right "Okolica: Kraków" with small pin and chevron. A discreet but readable "Dane demo" notice beside the heading.
3. Broad pale mint primary action section. Left aligned heading "Zacznij od potrzeby." next line "Znajdź rozwiązanie." Modest heading around 32px, not enormous. One short explanatory sentence "Opisz problem, a pomożemy Ci znaleźć istniejące innowacje społeczne." Green prominent button "Zgłoś problem" with right arrow; secondary text link "Przeglądaj innowacje". On the right a simple typographic three-step explanation, not charts or fake screenshots: "Opisz potrzebę", "Potwierdź powiązanie", "Poznaj rozwiązania". Delicate line connectors and small outline icons, no complex illustration. Small legible note beneath: "Każde dopasowanie pokazuje źródła i ograniczenia."
4. Below a 2/3 and 1/3 content layout. Left title "Potrzeby w Twojej okolicy", action "Zobacz wszystkie", location filter "Kraków" and dropdown "Promień: 10 km". Small note "Promień dotyczy przeglądania potrzeb." Show TWO stacked white need rows with aligned title, supporting summary, location/distance and distinct unique-reporting-user count:
"Samotność osób starszych" / "Brakuje regularnych spotkań i wsparcia sąsiedzkiego." / "Kraków • 2,4 km" / "23 osoby zgłosiły" / link "Zobacz potrzebę".
"Trudny dostęp do transportu" / "Dojazd do zajęć i usług jest barierą dla mieszkańców." / "Kraków • 5,1 km" / "11 osób zgłosiło" / link "Zobacz potrzebę".
Small text link below "Najczęściej zgłaszane potrzeby". Do not show growth percentages or trends charts.
Right section heading "Wróć do swoich spraw" as a white quiet surface, with two compact activity rows:
"Twoje zgłoszenie" / "Brak dostępnych zajęć w okolicy" / textual green status "Dopasowania gotowe" / link "Zobacz rozwiązania".
"Twój pomysł" / "Sąsiedzkie spotkania" / textual amber status "Oczekuje na potwierdzenie" / link "Sprawdź szkic".
Under it a simple white compact volunteering panel: title "Włącz się w pilotaż" / "Sąsiedzka pomoc" / text "Rekrutacja" / "Kraków" / action "Zobacz możliwości udziału". Orange may subtly highlight the recruitment status; never make it an emergency.
5. Lower slim pair of functional shortcuts with outline icons, not big marketing cards: "Masz własny pomysł?" with link "Rozwiń pomysł"; "Działasz w instytucji?" with link "Dostosuj innowację".
Bottom low-key links "Pomoc", "Prywatność", "Dostępność".

Constraints: Carefully render the quoted Polish UI labels verbatim with diacritics and clear crisp legible typography. All primary actions minimum visually 44px tall. This is a mockup of authenticated home, no login modal. No payments, crowdfunding, donation values, municipal official panel, institution third role, endorsement logos, fake claims of tested success. Do not put semantic 3D or geographic map on home; those have their own views. Page should look usable, crafted, coherent and ready for implementation. One restrained light theme throughout.
```

## Telefon

```text
Use case: ui-mockup. Input image 1 is the style and content reference: the approved-direction DESKTOP authenticated homepage of the Polish civic application HUBMI. Generate a matching MOBILE responsive home page mockup. Preserve visual identity, palette, typography, domain semantics and key texts. This is a new portrait responsive composition, not a resized screenshot. Show one single tall flat mobile page screen, approximately 440x1300 CSS proportions, rendered at high resolution. No physical device/bezel, no perspective, no board label, no dark surround.

Same Friendly Civic Tech palette: #FAF8F3 warm ivory page, white surfaces, #172B26 dark text, #52645B muted text, #146B52 green primary, #B84A1B rust accent, #E7F2EC soft mint. Source Sans 3 style, crisp legible Polish diacritics, body around 16px and page headings around 28px. 16-20px horizontal margins, one column, clear generous vertical rhythm, thin line icons, 8px button radii and 12px panel radii. Green buttons full width 48px high. All links comfortably touchable. All visible body text must be readable. No horizontal overflow, no teeny desktop typography.

Mobile composition:
Top slim white header: "HUBMI" left, bell and circular account control right. No desktop navigation in the header.
Then a small tasteful "Dane demo" badge, heading "Dzień dobry!", muted line "Co możemy zmienić w Twojej okolicy?" and full-width location selector "Okolica: Kraków".
Mint reporting block with heading "Zacznij od potrzeby." and "Znajdź rozwiązanie." on successive natural lines. Sentence "Opisz problem, a pomożemy Ci znaleźć istniejące innowacje społeczne." Prominent full-width green CTA "Zgłoś problem" with arrow, secondary centered text link "Przeglądaj innowacje". Compact muted sentence "Każde dopasowanie pokazuje źródła i ograniczenia." Collapse the desktop three-step decorative explanation entirely in mobile, keeping all functional reporting content.
Next section heading "Potrzeby w Twojej okolicy", text link "Zobacz wszystkie". Two compact filters on same row "Kraków" and "Promień: 10 km". Two vertically stacked clean need rows, without nested cards or oversized icon circles:
1. Title "Samotność osób starszych", single compact description "Brakuje spotkań i wsparcia sąsiedzkiego.", metadata "Kraków • 2,4 km" and "23 osoby zgłosiły", action "Zobacz potrzebę".
2. Title "Trudny dostęp do transportu", description "Dojazd do zajęć i usług jest barierą.", metadata "Kraków • 5,1 km" and "11 osób zgłosiło", action "Zobacz potrzebę".
All synthetic counts visibly covered by top "Dane demo" badge. Each row title can wrap naturally, no text collisions.
Then section "Wróć do swoich spraw" with one compact white activity block: "Twoje zgłoszenie", "Brak dostępnych zajęć w okolicy", green TEXT status "Dopasowania gotowe" and link "Zobacz rozwiązania". Follow compact second row "Twój pomysł", "Sąsiedzkie spotkania", amber TEXT status "Oczekuje na potwierdzenie", link "Sprawdź szkic". Both are private user activity entries, not public approvals.
If space allows a restrained action row "Włącz się w pilotaż" / "Zobacz możliwości udziału"; below fold extras can be omitted to preserve readable size. Do not cram every desktop shortcut into the mobile viewport.
At absolute bottom show a slim fixed white bottom navigation with FIVE equally spaced thin-outline-icon plus readable text items: "Start" active green, "Potrzeby", "Innowacje", "Pomysły", "Pilotaże". Generous 44px targets, selected Start on subtle pale mint highlight. Reserve enough bottom safe-area padding so it covers no content. Must show all five labels correctly and horizontally fit.

Constraints: only the mobile home page; no login screen, no admin/official third role, no payment/crowdfunding UI, no donation amount, no fake impact claims, no 3D/map scene, no giant marketing hero, no stock photography needed for this task-oriented page. One consistent light theme, no decorative dots except semantic status. Preserve the desktop identity and core task order. Render quoted Polish text verbatim. Professional high fidelity product mockup, excellent responsive craft.
```

## Korekta telefonu

```text
Use case: precise-object-edit / ui-mockup. Edit the MOBILE HUBMI home-page mockup in input image 1. Make exactly one layout correction: remove the very last "Włącz się w pilotaż" / "Sąsiedzka pomoc" panel, which is currently clipped behind the bottom navigation. That optional pilot shortcut is omitted from this mobile viewport; pilots remain accessible from bottom navigation. After the complete "Wróć do swoich spraw" panel, leave a clean 24px CSS-equivalent ivory gap, THEN the bottom navigation as a separate white strip with full safe-area space. The bottom navigation must not overlap, obscure, or crop any content. Keep the portrait page, header, Dane demo badge, greeting, location, mint reporting panel, both needs, both user activity rows, colors, typography, spacing and all other text unchanged. Keep EXACTLY five bottom navigation icons and labels: "Start", "Potrzeby", "Innowacje", "Pomysły", "Pilotaże", same selected green Start. No additional elements. Flat high fidelity responsive UI mockup, sharp readable Polish text and natural panel boundaries. No device frame.
```

