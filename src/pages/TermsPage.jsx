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

    <h2>6. Content imported from other sites</h2>
    <p>
      Renscraft lets you choose how a reference URL is used. In{" "}
      <em>inspiration</em> mode, only design tokens (colors, fonts, spacing,
      shadows) are read — no text or images are copied. In <em>remake</em> mode,
      text and images from that page are imported as content for your project.
    </p>
    <p>When you select remake mode, you confirm that:</p>
    <ul>
      <li>
        You own the content, or you have the copyright owner&apos;s permission
        to use it in this way.
      </li>
      <li>
        You are solely responsible for the imported content and for how it is
        used in the website you publish.
      </li>
      <li>
        You will not use the feature to copy, republish, or redistribute someone
        else&apos;s work without their permission.
      </li>
    </ul>
    <p>
      If a copyright owner reports that a website on Renscraft uses their
      content without permission, we may unpublish that website — and, in
      serious or repeated cases, suspend the account — without prior notice.
      Where practical, we will inform the site owner of the action taken.
    </p>

    <h2>7. Your content and ownership</h2>
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

    <h2>8. AI limitations</h2>
    <p>
      Renscraft uses large language models. AI can make mistakes: wrong
      information, unexpected layouts, or code that doesn&apos;t work exactly as
      you hoped. Always review generated code before publishing it for real
      users. We do not guarantee that any generation will match what you had in
      mind.
    </p>

    <h2>9. Service availability</h2>
    <p>
      We aim to keep Renscraft online, but we do not guarantee uninterrupted
      access. We may pause, modify, or discontinue parts of the service at any
      time. If we shut down the service permanently, we will give reasonable
      notice so you can export your projects.
    </p>

    <h2>10. Limitation of liability</h2>
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

    <h2>11. Changes to these terms</h2>
    <p>
      We may update these terms from time to time. If we make a material change,
      we will notify you by email or by a notice in the app. Continued use of
      Renscraft after the change means you accept the updated terms.
    </p>

    <h2>11.1 Ad-Supported Service and Free Credits</h2>
    <p>
      Renscraft offers a free tier supported by third-party advertising
      (Adsterra). You may earn "Free Credits" by interacting with these ads or
      sponsor links. By using this feature, you agree to:
    </p>
    <ul>
      <li>
        Actually view the ad for the required duration (e.g., 30 seconds).
      </li>
      <li>
        Not use VPNs, proxies, bots, or automated scripts to exploit or farm the
        free credit system.
      </li>
      <li>
        Not use ad-blocking software, DNS filters, or extensions that prevent
        the loading of our ads. We reserve the right to restrict access to our
        services if an ad-blocker is detected.
      </li>
    </ul>
    <p>
      We reserve the right to modify the amount of free credits awarded, the
      required viewing duration, and the daily limits at any time. Abusing this
      system will result in immediate account suspension and forfeiture of all
      earned credits.
    </p>

    <h2>11.2 Adblockers and Service Access</h2>
    <p>
      Because Renscraft relies on ad revenue to keep the platform running, we
      may detect the use of ad-blocking extensions or network-level ad blockers.
      While we respect your choice to use them, doing so may prevent you from
      accessing certain features (such as the Free Credits page) or the service
      as a whole.
    </p>

    <h2>12. Governing law</h2>
    <p>
      These terms are governed by the laws of the Republic of Indonesia. Any
      dispute will be handled in the courts of Indonesia.
    </p>

    <h2>13. Contact</h2>
    <p>
      Questions about these terms? <Link to="/contact">Contact us</Link> or
      email <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>
      .
    </p>
  </LegalLayout>
);

export default TermsPage;
