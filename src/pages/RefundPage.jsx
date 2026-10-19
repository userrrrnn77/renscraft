// src/pages/RefundPage.jsx

import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout";

const RefundPage = () => (
  <LegalLayout
    title="Refund Policy"
    intro="Credits are digital goods, so they are generally non-refundable. But we make sure you never pay for a build that failed on our side."
    metaDescription="Renscraft's Refund Policy — when we refund credits automatically, and how to request a refund for a purchase.">
    <h2>1. Automatic refunds for failed builds</h2>
    <p>
      This is the most important part:{" "}
      <strong>
        if a generation or revision fails on our side, the credits are
        automatically returned to your balance
      </strong>{" "}
      — no email needed, no support ticket.
    </p>
    <p>A build is considered failed if:</p>
    <ul>
      <li>The AI could not produce working code after all retries.</li>
      <li>
        The generation or revision timed out (for example, the server was
        restarted before it finished).
      </li>
      <li>
        The AI returned operations that could not be applied — meaning your
        project files were not actually changed.
      </li>
    </ul>
    <p>
      In all of those cases, the held credits are refunded to your account
      within seconds. You will see your updated balance immediately, and a
      notification in the app.
    </p>

    <h2>2. When credits are NOT refunded</h2>
    <p>
      Once a generation or revision{" "}
      <strong>successfully applies changes</strong>, the credits are spent —
      even if you later decide you don&apos;t like the result. AI output is
      subjective, and we cannot refund based on taste.
    </p>
    <p>
      That&apos;s why every generation comes with{" "}
      <strong>3 credits worth of free revisions</strong> (each revision costs 3
      credits, and the first revision after a generation is on us for new
      accounts). Use revisions to steer the design toward what you want before
      spending more.
    </p>

    <h2>3. Refunds for credit purchases</h2>
    <p>
      Unused credit purchases may be refunded within <strong>7 days</strong> of
      purchase, minus the Midtrans transaction fee, if:
    </p>
    <ul>
      <li>You have not spent any of the credits from that purchase, and</li>
      <li>
        You contact us with the order ID (visible in the Top-up modal history)
        and a reason.
      </li>
    </ul>
    <p>
      Refunds are processed back through Midtrans to the original payment
      method. Bank processing usually takes 3–7 business days.
    </p>

    <h2>4. Duplicate or accidental charges</h2>
    <p>
      If you were charged twice for the same order, or if you never received the
      credits after a successful payment, <Link to="/contact">contact us</Link>{" "}
      immediately with the order ID. We will resolve it within 1 business day.
    </p>

    <h2>5. Chargebacks</h2>
    <p>
      If you file a chargeback with your bank instead of contacting us first,
      your account may be suspended while we investigate. Please talk to us
      first — we are humans and we can almost always fix things faster than a
      bank can.
    </p>

    <h2>6. Service shutdown</h2>
    <p>
      If we ever shut down Renscraft permanently, we will give at least{" "}
      <strong>30 days&apos; notice</strong>. During that window you can export
      all your projects as ZIPs. Any unused credits at the shutdown date will be
      refunded pro-rata to their purchase price.
    </p>

    <h2>7. How to request a refund</h2>
    <ol>
      <li>
        Find your order ID in the app: open the <strong>Top up</strong> modal
        and look under &quot;Recent orders&quot;.
      </li>
      <li>
        Email{" "}
        <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>{" "}
        with the order ID, a short reason, and the email on your account.
      </li>
      <li>We reply within 1 business day.</li>
    </ol>

    <h2>8. Contact</h2>
    <p>
      Refund questions? <Link to="/contact">Contact us</Link> or email{" "}
      <a href="mailto:developer@rensdev.my.id">developer@rensdev.my.id</a>.
    </p>
  </LegalLayout>
);

export default RefundPage;
