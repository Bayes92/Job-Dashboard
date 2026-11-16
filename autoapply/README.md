# Career AutoApply — assistente locale per il Mac

Uno strumento Playwright gratuito che legge **le offerte reali di Notion tramite l'API di Mission Control**, apre gli annunci nel browser, compila i dati di contatto che trova e carica un CV PDF se riconosce con sicurezza il relativo campo. Non inventa le risposte ai requisiti, non aggira login/CAPTCHA e **non fa mai clic sul pulsante finale di invio**.

## Avvio rapido sul Mac (una sola riga)

Se **Node.js LTS** è già installato, apri **Terminale**, copia questo comando e premi Invio:

```bash
cd ~/Downloads && curl -fLsS -o CareerAutoApply.zip https://github.com/Bayes92/Job-Dashboard/archive/refs/heads/main.zip && unzip -oq CareerAutoApply.zip && bash Job-Dashboard-main/autoapply/avvia-mac.sh
```

Il primo avvio installa Playwright e Chromium, chiede dove si trovano i due CV PDF e mostra le offerte **registrate il 16/11/2026** ancora da valutare. Se vuoi usare il sistema nei giorni successivi, dal Terminale lancia `bash ~/Downloads/Job-Dashboard-main/autoapply/avvia-mac.sh --all` per tutte le offerte non scartate e non segnate come inviate.

Non c'è alcun invio senza la tua azione nel browser. I dati personali e i PDF restano sul Mac.

## Prima installazione (MacBook Air)

1. Installa **Node.js LTS** da [nodejs.org](https://nodejs.org/), se non è già installato.
2. Apri **Terminale** e scarica il repository (oppure scarica lo ZIP da GitHub):

   ```bash
   git clone https://github.com/Bayes92/Job-Dashboard.git
   cd Job-Dashboard/autoapply
   npm install
   npx playwright install chromium
   npm run setup
   ```

3. Quando richiesto, inserisci nome, email, telefono, link LinkedIn e trascina nel Terminale i PDF del CV italiano e inglese. I dati sono salvati **solo sul Mac** in `config.local.json`, escluso da Git.
4. Per aprire le offerte registrate **il 16 novembre 2026**:

   ```bash
   npm start -- --date=2026-11-16
   ```

   Per tutte le offerte ancora in valutazione: `npm start -- --all`.
   Per una scheda specifica: `npm start -- --id=ID_NOTION`.

## Modalità batch (meno passaggi)

In questa modalità Career AutoApply seleziona tutte le opportunità filtrate e cerca di premere il pulsante iniziale **Apply**, prima di compilare i dati personali e caricare il CV:

```bash
bash avvia-mac.sh --date=2026-11-16 --auto
```

Se il form non si apre da solo, il programma si ferma e chiede di aprirlo nel browser. **L'invio finale resta manuale:** nessun click su Submit, nessuna risposta inventata e nessun contrassegno di candidatura inviata senza una conferma verificabile. Gmail Inviati e il registro esterno non sono controllati automaticamente; evita duplicati controllandoli prima dell'invio.

## Cosa succede

- Il programma elenca le offerte Notion non segnate come inviate o scartate e non presenti in `autoapply/data/applied.csv`.
- Scegli i numeri delle offerte da preparare.
- Si apre Chromium, sul portale aziendale. Se necessario, premi *Apply*.
- Premi Invio nel Terminale: il programma prova a inserire dati personali **in campi riconosciuti** e ad allegare il CV.
- **Controlla sempre tutto**: consenso privacy, retribuzione, esperienza dbt/DAX, eligibility Italia, ulteriori domande. Non dichiarare esperienza che non hai.
- Invia tu il form sul sito. Il programma può annotare un esito nel CSV **solo dopo che hai visto la conferma della candidatura e risposto SI**.

## Importante: deduplica

Notion e il CSV locale sono controllati automaticamente. **Non sono ancora integrati** Gmail Inviati, il CSV esterno `/workspace/jobs/applied.csv` e portali aziendali: controllali prima di inviare. Il programma ti ricorda di farlo. Le righe con stato *Candidatura inviata* o *Scartata* vengono escluse.

Il CSV `data/applied.csv` registra invii confermati **localmente**. Il programma **non cambia da solo lo stato Notion**. Fallo manualmente nella scheda corrispondente dopo conferma, per evitare falsi positivi. Questa versione è un assistente di compilazione, **non** un bot di invio autonomo.

## Privacy e limiti

I CV e i dati di contatto **non sono caricati su GitHub**. Il profilo browser persistente in `.profile/`, la configurazione e i dati delle candidature sono esclusi da Git. Non inserire password nel codice. Questo strumento non sostituisce il controllo dei requisiti né garantisce la compilazione di ogni portale.

### Repository
https://github.com/Bayes92/Job-Dashboard/tree/main/autoapply
