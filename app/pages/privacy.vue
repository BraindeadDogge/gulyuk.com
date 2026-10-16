<script setup lang="ts">
useSeoMeta({
  title: 'Privacy',
  description: 'What this site records about visits, why, for how long, and how to switch it off.',
})
</script>

<template>
  <article class="page prose legal">
    <h1>Privacy</h1>
    <p class="mono muted">Last updated 16 October 2026</p>

    <p>
      This site does not use cookies, has no accounts or forms, and shows no advertising. The only thing it records
      is pseudonymous visit statistics (not linked to your name or an account), described below. You can switch that off at any time with the
      “stop counting my visits” button in the footer.
    </p>

    <h2>Who is responsible</h2>
    <p>
      Grigory Gulyuk, an individual based in Cyprus, runs gulyuk.com and decides how the data below is used (the
      “controller” under the GDPR). Contact:
      <a href="mailto:grigory.gulyuk@gmail.com">grigory.gulyuk@gmail.com</a>.
    </p>

    <h2>What is recorded, and why</h2>
    <p>
      I want to know which writing gets read, how far people get, and how many people look at my CV, so I can write
      better things. For that I run Umami, open-source analytics software that I host myself at
      <code>stats.gulyuk.com</code>. It records, for each page you open:
    </p>
    <ul>
      <li>the page address (without anything after a “?” or “#”), the site you came from, your browser and operating-system type, screen size, language, and an approximate country;</li>
      <li>a visit identifier. Umami computes it from your IP address, your browser and a secret value that changes periodically. It is not stored on your device. Your IP address itself is used only to work out the country and this identifier and is not stored.</li>
    </ul>
    <p>While you read, the site also records these events, each without any information about who you are:</p>
    <ul>
      <li>how far down an article you scrolled (25, 50, 75 and 100 per cent) and about how long the page was open and on screen;</li>
      <li>in the interactive essay, which chapters you reached and which figures you used;</li>
      <li>that the CV page was opened, that the PDF was downloaded, and that a profile link (LinkedIn, GitHub) or another link to a different website was clicked. For links to other sites only the website’s name is recorded, never the full address;</li>
      <li>if I sent you a link that ends in something like <code>?ref=name</code>, that label, once. I choose the label; it is not information about you.</li>
    </ul>
    <p>
      The legal basis is my legitimate interest in understanding how the site is used (GDPR Article 6(1)(f)). I have
      weighed it against your interests: the data is used only in totals for this site, is not combined with
      anything else, is not shared with anyone for their own purposes, is not used to profile or contact you, and
      you can object at any time (see below). I do not try to find out who a visitor is, and I do not use
      fingerprinting or look up companies from IP addresses.
    </p>

    <h2>How long it is kept</h2>
    <p>Visit statistics are deleted after 13 months. Anything you cannot see here, such as hosting logs, is covered below.</p>

    <h2>Who else handles data</h2>
    <ul>
      <li><strong>Railway</strong> hosts the website files and the statistics server, and <strong>Cloudflare</strong> provides the domain name service and delivers the site. They act on my behalf under their data processing terms and may keep technical logs, including IP addresses, for security and operation. I do not use those logs for statistics. These providers may process data outside the European Economic Area; where they do, the transfer relies on the safeguards in the processing terms I have accepted with them (standard contractual clauses or the EU–US Data Privacy Framework).</li>
      <li><strong>LinkedIn</strong> is contacted only if you press “Load LinkedIn post”. Until then nothing from LinkedIn is loaded. When you do press it, your browser connects to LinkedIn, which may set cookies and see your IP address; see LinkedIn’s own privacy policy.</li>
    </ul>

    <h2>What is stored on your device</h2>
    <p>No cookies. The site saves these small settings in your browser’s local storage. They only hold your own choices, are read only by this site and are never sent anywhere:</p>
    <ul>
      <li><code>gulyuk-theme</code>: light or dark appearance;</li>
      <li><code>gulyuk-view</code>: graph or list on the home page;</li>
      <li><code>ap-target</code>: the example function you picked in the interactive essay;</li>
      <li><code>gulyuk-optout</code>: that you asked not to be counted.</li>
    </ul>

    <h2>Your choices and rights</h2>
    <p>
      The footer button stops all counting at once and remembers your choice on this device. If your browser sends
      Global Privacy Control or Do Not Track, the site honours it automatically and loads no statistics code at all.
    </p>
    <p>
      Under the GDPR you may ask for access to your data, correction, erasure, restriction or portability, and you
      may object to the statistics. Because the statistics are not linked to your name or device, I usually cannot
      find data about one person; write to me anyway and I will help where I can. You may also complain to the
      supervisory authority, in Cyprus the Office of the Commissioner for Personal Data Protection
      (<a href="https://www.dataprotection.gov.cy" rel="noopener">dataprotection.gov.cy</a>), or to the authority in
      the country where you live.
    </p>
    <p>You are not required to provide any data to use this site, and nothing here involves automated decisions about you.</p>
  </article>
</template>
