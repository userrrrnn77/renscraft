// src/pages/TermsPage.jsx

import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

const TermsPage = () => (
  <LegalLayout
    title="Terms of Service"
    intro="These terms govern your use of Renscraft. By creating an account, you agree to them."
    metaDescription="Renscraft's Terms of Service — rules for using our AI website builder, purchasing credits, and publishing websites.">
    <h2>1. What Renscraft is</h2>
    <p>
      Renscraft is an AI-powered website builder. You describe the website you
      want, and our service generates React source code, shows you a live
      preview, and lets you revise it through chat. You can then publish it
      under a Renscraft link or export the code as a ZIP.
    </p>

    <h2>2. Your account</h2>
    <p>
      You must provide accurate information when creating an account. You are
      responsible for everything that happens under your account, including
      keeping your password safe. Tell us immediately if you suspect
      unauthorized access.
    </p>
    <p>
      You must be at least 13 years old to use Renscraft. If you are under 18,
      you confirm that you have permission from a parent or legal guardian.
    </p>

    <h2>3. Credits and purchases</h2>
    <p>
      Renscraft uses a credit system. Credits are purchased in packs through
      Midtrans (our payment processor). One generation costs{" "}
      <strong>12 credits</strong>, and one revision costs{" "}
      <strong>3 credits</strong> at the time of writing. Current prices are
      shown on the <Link to="/pricing">Pricing page</Link>.
    </p>
    <ul>
      <li>
        Credits <strong>never expire</strong>.
      </li>
      <li>
        If a generation or revision fails on our side, the credits are{" "}
        <strong>automatically refunded</strong> to your balance. See the{" "}
        <Link to="/refund">Refund Policy</Link> for details.
      </li>
      <li>
        Credits are personal and cannot be transferred, sold, or exchanged for
        cash.
      </li>
    </ul>

    <h2>4. Acceptable use</h2>
    <p>You agree NOT to use Renscraft to:</p>
    <ul>
      <li>
        Generate content that is illegal, hateful, sexually explicit, or that
        infringes someone else&apos;s rights.
      </li>
      <li>
        Create phishing sites, malware, or anything designed to deceive or harm
        people.
      </li>
      <li>
        Impersonate another person, brand, or organization in a way that
        misleads visitors.
      </li>
      <li>
        Abuse the free credit system (for example, creating multiple accounts
        from the same network to farm credits).
      </li>
      <li>Attempt to break, overload, or reverse-engineer the service.</li>
    </ul>
    <p>
      We may suspend or terminate accounts that violate these rules, without
      prior notice and without refunding unused credits.
    </p>

    <h2>5. Reference websites and third-party content</h2>
    <p>
      When you paste a reference URL, Renscraft reads publicly available content
      from that page (text, images, design tokens) and uses it as input for the
      AI. You are responsible for confirming you have the right to use any
      third-party content you reference.
    </p>
    <p>
      Generated websites are <strong>inspired by</strong> the reference — they
      are not clones. You are responsible for ensuring your published site does
      not infringe on anyone&apos;s intellectual property.
    </p>

    <h2>6. Your content and ownership</h2>
    <p>
      You own the code that Renscraft generates for you and the content you
      provide (prompts, answers to the brief, uploaded assets). You can publish
      it, export it, or modify it however you want.
    </p>
    <p>
      You grant us a limited license to store, process, and display your project
      so we can run the service — for example, rendering the preview, generating
      the ZIP, or serving your published website.
    </p>

    <h2>7. AI limitations</h2>
    <p>
      Renscraft uses large language models. AI can make mistakes: wrong
      information, unexpected layouts, or code that doesn&apos;t work exactly as
      you hoped. Always review generated code before publishing it for real
      users. We do not guarantee that any generation will match what you had in
      mind.
    </p>

    <h2>8. Service availability</h2>
    <p>
      We aim to keep Renscraft online, but we do not guarantee uninterrupted
      access. We may pause, modify, or discontinue parts of the service at any
      time. If we shut down the service permanently, we will give reasonable
      notice so you can export your projects.
    </p>

    <h2>9. Limitation of liability</h2>
    <p>
      Renscraft is provided &quot;as is&quot;. To the maximum extent allowed by
      law, we are not liable for any indirect, incidental, or consequential
      damages arising from your use of the service — including lost revenue,
      lost data, or reputational harm.
    </p>
    <p>
      Our total liability for any claim related to the service is limited to the
      amount you paid us in the 3 months before the claim.
    </p>

    <h2>10. Changes to these terms</h2>
    <p>
      We may update these terms from time to time. If we make a material change,
      we will notify you by email or by a notice in the app. Continued use of
      Renscraft after the change means you accept the updated terms.
    </p>

    <h2>11. Governing law</h2>
    <p>
      These terms are governed by the laws of the Republic of Indonesia. Any
      dispute will be handled in the courts of Indonesia.
    </p>

    <h2>12. Contact</h2>
    <p>
      Questions about these terms? <Link to="/contact">Contact us</Link> or
      email <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>
      .
    </p>
  </LegalLayout>
);

export default TermsPage;
