// src/pages/PrivacyPage.jsx

import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

const PrivacyPage = () => (
  <LegalLayout
    title="Privacy Policy"
    intro="This policy explains what data Renscraft collects, why we collect it, and how you can control it."
    metaDescription="Renscraft's Privacy Policy — what data we collect, who we share it with, and how to exercise your rights.">
    <h2>1. What we collect</h2>
    <p>
      We collect only what we need to run the service. Here is the full list:
    </p>
    <ul>
      <li>
        <strong>Account data:</strong> your name, email address, and (for email
        sign-ups) a securely hashed password. Google/GitHub sign-ins are handled
        by Supabase; we receive your name, email, and user ID, not your
        password.
      </li>
      <li>
        <strong>Project data:</strong> the prompts you send, the code generated
        for you, chat revisions, and any reference URLs you paste.
      </li>
      <li>
        <strong>Signup IP (hashed):</strong> when you create an account, we
        store an HMAC hash of your IP address. We use it purely for abuse
        prevention — for example, to prevent someone from farming free credits
        by creating dozens of accounts from the same network. We never store
        your raw IP.
      </li>
      <li>
        <strong>Usage logs:</strong> which model was called, how many tokens
        were used, and how much it cost us. These logs help us price credits
        fairly. They do not contain your prompts.
      </li>
      <li>
        <strong>Payment data (via Midtrans):</strong> when you buy credits, our
        payment processor Midtrans handles your card/bank details. We only
        receive the order ID, amount, status, and (optionally) the payment
        method type.
      </li>
    </ul>

    <h2>2. What we do NOT collect</h2>
    <ul>
      <li>We do not store your raw IP address.</li>
      <li>We do not store card numbers, CVVs, or bank credentials.</li>
      <li>We do not run third-party advertising trackers.</li>
      <li>We do not sell or rent your data to anyone.</li>
    </ul>

    <h2>3. How we use your data</h2>
    <ul>
      <li>To create your account and let you sign in.</li>
      <li>To generate websites and revisions based on your prompts.</li>
      <li>To keep your credit balance accurate.</li>
      <li>To prevent abuse, fraud, and credit farming.</li>
      <li>
        To improve the product — for example, by analysing which prompts fail
        most often.
      </li>
      <li>To contact you about your account or important service changes.</li>
    </ul>

    <h2>4. Who we share data with</h2>
    <p>
      We work with a small number of trusted providers to run Renscraft. Each
      one only receives what it needs:
    </p>
    <ul>
      <li>
        <strong>Midtrans</strong> — payment processing. Receives your name,
        email, order ID, and amount when you buy credits.
      </li>
      <li>
        <strong>Supabase</strong> — handles Google and GitHub OAuth sign-in.
        Receives your email and OAuth identity when you use those buttons.
      </li>
      <li>
        <strong>Cloudflare R2</strong> — stores images we mirror from reference
        websites and assets you upload. Public URLs served from our domain.
      </li>
      <li>
        <strong>AI providers</strong> — the language models that generate your
        code. Your prompt, brief answers, and (when relevant) reference content
        are sent to the model provider. We select providers that do not use your
        data for training.
      </li>
      <li>
        <strong>Infrastructure providers</strong> — servers and databases where
        your project data lives.
      </li>
    </ul>
    <p>
      We may also disclose data if required by Indonesian law or a valid legal
      process.
    </p>

    <h2>5. Cookies and local storage</h2>
    <p>Renscraft uses a small number of cookies and browser storage:</p>
    <ul>
      <li>
        <strong>Session cookie</strong> (<code>token</code>) — a signed JWT that
        keeps you logged in. HttpOnly, not accessible to JavaScript.
      </li>
      <li>
        <strong>localStorage</strong> — your theme preference (light/dark) and
        the last view mode you picked on the My Projects page.
      </li>
      <li>
        <strong>sessionStorage</strong> — the current brief ID, so the wizard
        survives a page refresh.
      </li>
    </ul>
    <p>We do not use tracking or advertising cookies.</p>

    <h2>6. How long we keep your data</h2>
    <ul>
      <li>
        <strong>Account and projects:</strong> as long as your account is
        active. When you delete a project, it is removed from our database.
      </li>
      <li>
        <strong>Signup IP hashes:</strong> 30 days (the abuse-guard window),
        after which the record expires automatically.
      </li>
      <li>
        <strong>Payment records:</strong> kept as required for tax and
        accounting purposes, even after you delete your account.
      </li>
    </ul>

    <h2>7. Your rights</h2>
    <p>Depending on where you live, you may have the right to:</p>
    <ul>
      <li>Access the personal data we hold about you.</li>
      <li>Correct information that is inaccurate.</li>
      <li>Delete your account and associated data.</li>
      <li>
        Export your projects (you can do this yourself via the Export button).
      </li>
      <li>Object to or restrict certain processing.</li>
    </ul>
    <p>
      To exercise any of these, <Link to="/contact">contact us</Link> or email{" "}
      <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>. We
      will respond within 30 days.
    </p>

    <h2>8. Security</h2>
    <p>
      We use industry-standard practices: HTTPS everywhere, hashed passwords
      (bcrypt), HttpOnly session cookies, HMAC-hashed IPs, and access controls
      on our database. No system is perfect; if you spot a vulnerability, please
      disclose it responsibly to the email above.
    </p>

    <h2>9. Children</h2>
    <p>
      Renscraft is not intended for children under 13. If we learn that a child
      under 13 has created an account, we will delete it.
    </p>

    <h2>10. Changes to this policy</h2>
    <p>
      We may update this policy. Material changes will be announced by email or
      in the app before they take effect.
    </p>

    <h2>11. Contact</h2>
    <p>
      Privacy questions? <Link to="/contact">Contact us</Link> or email{" "}
      <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>.
    </p>
  </LegalLayout>
);

export default PrivacyPage;
