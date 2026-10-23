(() => {
  "use strict";

  const { questions: qcmQuestions, themes, sources } = window.CIVIC_DATA;
  const officialQuestions = window.OFFICIAL_CIVIC_BANK.questions;
  const situationQuestions = qcmQuestions.filter(q => q.type === "situation");
  const cardQuestions = [...officialQuestions, ...situationQuestions];
  const reviewableQuestions = [...cardQuestions, ...qcmQuestions.filter(q => !cardQuestions.some(card => card.id === q.id))];
  const app = document.querySelector("#app");
  const STORAGE_KEY = "cap-citoyen-progress-v1";
  const EXAM_KEY = "cap-citoyen-active-exam-v1";
  const LETTERS = ["A", "B", "C", "D"];
  let timerId = null;
  let flashSession = null;
  let practiceSession = null;

  const sourceUrls = {
    livret: "https://www.legifrance.gouv.fr/download/pdf?id=isr0azgWEe4wSbu_Z-hm_3tIAj0JcaOEDqWIfclQeWk=",
    questions: "https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/questions-de-connaissance-pour-lexamen-civique-nationalite-francaise.html",
    arrete: "https://www.legifrance.gouv.fr/loda/id/LEGISCTA000052382278",
    procedure: "https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise"
    ,officialData: "https://www.data.gouv.fr/datasets/examen-civique-naturalisation-questions-de-connaissances-officielles-et-propositions-de-reponses"
  };

  const themeNamesEn = {
    t1: "Principles and values of the French Republic",
    t2: "French institutions and political system",
    t3: "Rights and duties",
    t4: "French history, geography and culture",
    t5: "Living in French society"
  };

  const contextNotes = [
    {
      match: /charles de gaulle|général de gaulle|appel à la résistance/i,
      title: "Charles de Gaulle",
      wiki: "Charles_de_Gaulle",
      fr: "Charles de Gaulle (1890–1970) est un général et homme d’État français. Il dirige la France libre pendant la Seconde Guerre mondiale, fonde la Ve République en 1958 et en devient le premier président. Son appel du 18 Juin 1940 symbolise la Résistance.",
      en: "Charles de Gaulle (1890–1970) was a French general and statesman. He led Free France during the Second World War, founded the Fifth Republic in 1958 and became its first president. His Appeal of 18 June 1940 became a symbol of the Resistance."
    },
    {
      match: /simone veil/i,
      title: "Simone Veil",
      wiki: "Simone_Veil",
      fr: "Simone Veil (1927–2017), rescapée de la Shoah, est une femme d’État française. Ministre de la Santé, elle porte la loi de 1975 dépénalisant l’interruption volontaire de grossesse. Elle devient ensuite la première présidente du Parlement européen élu au suffrage universel.",
      en: "Simone Veil (1927–2017), a Holocaust survivor, was a French stateswoman. As Minister of Health, she led the 1975 law decriminalising voluntary termination of pregnancy. She later became the first president of the directly elected European Parliament."
    },
    {
      match: /marie curie/i,
      title: "Marie Curie",
      wiki: "Marie_Curie",
      fr: "Marie Curie (1867–1934) est une physicienne et chimiste d’origine polonaise devenue française. Pionnière des recherches sur la radioactivité, elle est la première femme à recevoir un prix Nobel et la seule personne récompensée dans deux disciplines scientifiques différentes.",
      en: "Marie Curie (1867–1934) was a Polish-born physicist and chemist who became French. A pioneer in research on radioactivity, she was the first woman to receive a Nobel Prize and remains the only person awarded in two different scientific fields."
    },
    {
      match: /napoléon ier|napoléon 1er|code civil/i,
      title: "Napoléon Ier",
      wiki: "Napoléon_Ier",
      fr: "Napoléon Bonaparte devient empereur des Français en 1804. La même année, le Code civil rassemble et organise de nombreuses règles du droit privé. Ce texte a durablement influencé le droit français.",
      en: "Napoleon Bonaparte became Emperor of the French in 1804. That same year, the Civil Code brought together and organised many rules of private law. It had a lasting influence on French law."
    },
    {
      match: /révolution française|prise de la bastille|14 juillet 1789/i,
      title: "Révolution française",
      wiki: "Révolution_française",
      fr: "La Révolution française commence en 1789. Elle met fin à la monarchie absolue et fait émerger des principes majeurs comme la souveraineté nationale, l’égalité devant la loi et les droits de l’homme et du citoyen.",
      en: "The French Revolution began in 1789. It ended absolute monarchy and established major principles such as national sovereignty, equality before the law, and the rights of man and of the citizen."
    },
    {
      match: /shoah|génocide des juifs/i,
      title: "Shoah",
      wiki: "Shoah",
      fr: "La Shoah désigne la persécution et l’extermination systématique d’environ six millions de Juifs d’Europe par l’Allemagne nazie et ses alliés pendant la Seconde Guerre mondiale. Elle constitue un génocide.",
      en: "The Holocaust refers to the persecution and systematic murder of about six million European Jews by Nazi Germany and its allies during the Second World War. It was a genocide."
    },
    {
      match: /marianne|bonnet phrygien/i,
      title: "Marianne",
      wiki: "Marianne",
      fr: "Marianne est la représentation symbolique de la République française. Elle incarne notamment la liberté et la République ; son bonnet phrygien renvoie à l’idée d’émancipation héritée de la Révolution française.",
      en: "Marianne is the symbolic personification of the French Republic. She notably represents liberty and the Republic; her Phrygian cap refers to the idea of emancipation inherited from the French Revolution."
    },
    {
      match: /laïcité|séparation des églises et de l'état/i,
      title: "Laïcité en France",
      wiki: "Laïcité_en_France",
      fr: "La laïcité garantit la liberté de conscience et la neutralité de l’État à l’égard des religions. Elle protège le droit de croire, de ne pas croire ou de changer de religion, dans le respect de la loi et des droits d’autrui.",
      en: "French secularism guarantees freedom of conscience and the State’s neutrality towards religions. It protects the right to believe, not to believe, or to change religion, while respecting the law and the rights of others."
    },
    {
      match: /cinquième république|ve république|constitution de 1958/i,
      title: "Cinquième République",
      wiki: "Cinquième_République_(France)",
      fr: "La Ve République est le régime politique actuel de la France. Elle est fondée par la Constitution du 4 octobre 1958, qui organise les pouvoirs du Président de la République, du Gouvernement et du Parlement.",
      en: "The Fifth Republic is France’s current political system. It was established by the Constitution of 4 October 1958, which organises the powers of the President, the Government and Parliament."
    },
    {
      match: /union européenne|traité de maastricht|citoyenneté européenne/i,
      title: "Union européenne",
      wiki: "Union_européenne",
      fr: "L’Union européenne réunit des États qui exercent ensemble certaines compétences. Le traité de Maastricht, signé en 1992, crée notamment l’Union européenne et la citoyenneté européenne.",
      en: "The European Union brings together countries that exercise certain powers jointly. The Maastricht Treaty, signed in 1992, notably created the European Union and European citizenship."
    },
    {
      match: /sécurité sociale/i,
      title: "Sécurité sociale en France",
      wiki: "Sécurité_sociale_en_France",
      fr: "Créée en 1945, la Sécurité sociale protège la population contre plusieurs risques de la vie, notamment la maladie, la vieillesse, les accidents du travail et les charges liées à la famille.",
      en: "Created in 1945, the French social security system protects people against several life risks, including illness, old age, workplace accidents and family-related costs."
    },
    {
      match: /molière/i,
      title: "Molière",
      wiki: "Molière",
      fr: "Molière (1622–1673) est un dramaturge et comédien majeur du XVIIe siècle. Ses comédies, comme Le Misanthrope ou Le Malade imaginaire, critiquent les travers de la société et occupent une place centrale dans la culture française.",
      en: "Molière (1622–1673) was a major seventeenth-century playwright and actor. His comedies, including The Misanthrope and The Imaginary Invalid, criticise social behaviour and hold a central place in French culture."
    },
    {
      match: /victor hugo/i,
      title: "Victor Hugo",
      wiki: "Victor_Hugo",
      fr: "Victor Hugo (1802–1885) est un écrivain majeur du XIXe siècle et une figure engagée de la vie politique. Auteur notamment des Misérables, il défend la liberté, la justice sociale et l’abolition de la peine de mort.",
      en: "Victor Hugo (1802–1885) was a major nineteenth-century writer and an active political figure. The author of Les Misérables notably defended freedom, social justice and the abolition of the death penalty."
    },
    {
      match: /louis xiv|château de versailles/i,
      title: "Louis XIV",
      wiki: "Louis_XIV",
      fr: "Louis XIV (1638–1715), appelé le Roi-Soleil, incarne la monarchie absolue. Le château de Versailles, où il installe la cour et le gouvernement, devient un symbole durable du pouvoir royal.",
      en: "Louis XIV (1638–1715), known as the Sun King, embodied absolute monarchy. The Palace of Versailles, where he established the royal court and government, became an enduring symbol of royal power."
    },
    {
      match: /eugène delacroix|liberté guidant le peuple/i,
      title: "La Liberté guidant le peuple",
      wiki: "La_Liberté_guidant_le_peuple",
      fr: "Eugène Delacroix peint La Liberté guidant le peuple en 1830 après les Trois Glorieuses. La femme portant le drapeau tricolore est une allégorie de la Liberté, et non le portrait d’une personne réelle.",
      en: "Eugène Delacroix painted Liberty Leading the People in 1830 after the July Revolution. The woman carrying the French tricolour is an allegory of Liberty rather than a portrait of a real person."
    }
  ];

  function pedagogicalNote(q) {
    const singleAnswer = q.answers?.length === 1 ? q.answers[0] : q.choices?.[q.answer] || "";
    const haystack = `${q.q} ${singleAnswer}`;
    const note = contextNotes.find(item => item.match.test(haystack));
    if (note) return note;
    const answer = q.answers?.[0] || q.choices?.[q.answer] || "";
    const topic = themes[q.theme]?.name || "le programme civique";
    const topicEn = themeNamesEn[q.theme] || "the civic syllabus";
    if (/^(en quelle année|depuis quand|quand|de quand|à quelle date)/i.test(q.q)) {
      return {
        fr: `Il s’agit d’un repère chronologique. La date ou période à associer à cette question est « ${answer} ». Replacez-la sur une frise et reliez-la à l’événement cité pour mieux la mémoriser.`,
        en: `This is a chronological landmark. The date or period to associate with this question is the French answer “${answer}”. Place it on a timeline and connect it with the event mentioned in the question.`
      };
    }
    if (/^(où|dans quelle ville|dans quelle région|quelle chaîne de montagne)/i.test(q.q)) {
      return {
        fr: `Il s’agit d’un repère géographique. Le lieu à retenir est « ${answer} ». Associez ce nom à sa position et à l’événement, l’institution ou le monument mentionné dans la question.`,
        en: `This is a geographical landmark. The place to remember is the French answer “${answer}”. Connect this name with its location and with the event, institution or monument mentioned in the question.`
      };
    }
    if (/^(qui|quel artiste|quel peintre|quel écrivain|quel roi)/i.test(q.q)) {
      return {
        fr: `Cette question demande d’identifier une personne et ce qui la rend importante. Le repère attendu est « ${answer} ». Mémorisez ensemble le nom, la fonction ou l’œuvre citée et la période concernée.`,
        en: `This question asks you to identify a person and why they matter. The expected French answer is “${answer}”. Remember the name together with the role or work mentioned and the relevant period.`
      };
    }
    if (/^(qu'est-ce que|qu’est-ce que|que signifie|quelle est la définition)/i.test(q.q)) {
      return {
        fr: `La notion doit être comprise avant d’être mémorisée. Ici, l’idée essentielle est : « ${answer} ». Essayez de la reformuler avec vos propres mots, sans en modifier le sens.`,
        en: `Understand the concept before memorising it. The key idea here is expressed by the French answer “${answer}”. Try to restate it in your own words without changing its meaning.`
      };
    }
    if (/rôle|sert|mission|compétence/i.test(q.q)) {
      return {
        fr: `Cette carte porte sur une fonction ou une compétence précise : « ${answer} ». Pour éviter les confusions, distinguez-la des missions exercées par les autres institutions ou services du même domaine.`,
        en: `This card focuses on a specific role or power, expressed by the French answer “${answer}”. To avoid confusion, distinguish it from the responsibilities of other institutions or services in the same field.`
      };
    }
    return {
      fr: `Le point essentiel à retenir est : « ${answer} ». Cette connaissance appartient au thème « ${topic} ». Reliez les mots clés de la question à cette réponse pour pouvoir la reconnaître même si la formulation change.`,
      en: `The key point to remember is the French answer “${answer}”. This knowledge belongs to the “${topicEn}” section. Link the question’s keywords to this answer so that you can recognise it even when the wording changes.`
    };
  }

  function whyExplanation(q) {
    const answer = q.answers?.[0] || q.choices?.[q.answer] || "";
    const text = `${q.q} ${answer}`;
    const rules = [
      {
        match: /laïcité|séparation.*églises|doit rester neutre.*religion|neutralité de l['’]état|neutralité.*religion/i,
        fr: "La laïcité oblige l’État, ses administrations et ses agents à ne favoriser ni défavoriser aucune religion. Cette neutralité garantit à chaque usager un traitement égal et protège sa liberté de conscience.",
        en: "French secularism requires the State, its administrations and public officials neither to favour nor disadvantage any religion. This neutrality ensures equal treatment for every user and protects freedom of conscience."
      },
      {
        match: /liberté d['’]expression|réseaux sociaux|diffamation|incit.*haine/i,
        fr: "La liberté d’expression est fondamentale, mais elle s’exerce dans les limites fixées par la loi. Ces limites protègent notamment les personnes contre la diffamation, les menaces et l’incitation à la haine ou à la violence.",
        en: "Freedom of expression is fundamental, but it must be exercised within the limits set by law. These limits notably protect people against defamation, threats, and incitement to hatred or violence."
      },
      {
        match: /liberté d['’]association|association loi|créer.*association/i,
        fr: "Cette liberté permet aux personnes de se réunir autour d’un projet commun sans demander une autorisation préalable générale. La loi encadre toutefois l’objet et le fonctionnement des associations.",
        en: "This freedom allows people to join together around a shared project without needing general prior authorisation. The law nevertheless regulates the purpose and operation of associations."
      },
      {
        match: /changer.*religion|liberté de conscience|croire.*ne pas croire/i,
        fr: "La liberté de conscience protège les convictions personnelles. L’État ne peut imposer une religion : chacun peut croire, ne pas croire ou changer de religion, dans le respect de l’ordre public et des droits d’autrui.",
        en: "Freedom of conscience protects personal beliefs. The State cannot impose a religion: everyone may believe, not believe, or change religion while respecting public order and the rights of others."
      },
      {
        match: /impôt|impôts|services fiscaux|déclarer ses revenus/i,
        fr: "L’impôt finance les services et politiques publics, comme l’école, la santé, la justice ou la sécurité. La déclaration permet à l’administration de calculer la contribution de chacun selon les règles communes.",
        en: "Taxes fund public services and policies such as schools, healthcare, justice and security. Declaring income allows the administration to calculate each person’s contribution under common rules."
      },
      {
        match: /égalité|discrimination|mêmes droits|égalité devant la loi/i,
        fr: "Le principe d’égalité impose que la loi et les services publics traitent les personnes selon les mêmes règles, sauf différence de situation objectivement justifiée. Il interdit les discriminations fondées notamment sur l’origine, le sexe, la religion ou le handicap.",
        en: "The principle of equality requires the law and public services to treat people under the same rules unless an objectively justified difference in situation applies. It prohibits discrimination based notably on origin, sex, religion or disability."
      },
      {
        match: /état de droit|respect.*loi|au-dessus de la loi/i,
        fr: "Dans un État de droit, les citoyens comme les pouvoirs publics sont soumis aux règles juridiques. Des juges indépendants peuvent contrôler les décisions et protéger les droits fondamentaux.",
        en: "Under the rule of law, both citizens and public authorities are subject to legal rules. Independent judges can review decisions and protect fundamental rights."
      },
      {
        match: /vote|élection|suffrage|électeur|liste électorale/i,
        fr: "Le vote permet aux citoyens de choisir leurs représentants et de participer à la souveraineté nationale. Ses règles cherchent à garantir un choix libre, personnel, égal et secret.",
        en: "Voting allows citizens to choose their representatives and take part in national sovereignty. Its rules aim to guarantee a free, personal, equal and secret choice."
      },
      {
        match: /conseil constitutionnel/i,
        fr: "Le Conseil constitutionnel vérifie notamment que les lois respectent la Constitution. Ce contrôle empêche qu’une loi ordinaire porte atteinte aux règles et droits placés au sommet de l’ordre juridique français.",
        en: "The Constitutional Council notably checks that laws comply with the Constitution. This review prevents ordinary legislation from violating the rules and rights at the top of the French legal order."
      },
      {
        match: /assemblée nationale|député|députés/i,
        fr: "Les députés représentent la Nation à l’Assemblée nationale. Ils votent les lois, contrôlent l’action du Gouvernement et peuvent mettre en cause sa responsabilité.",
        en: "Members of the National Assembly represent the Nation. They pass laws, scrutinise the Government and may hold it politically accountable."
      },
      {
        match: /sénat|sénateur|sénateurs/i,
        fr: "Le Sénat participe au vote des lois avec l’Assemblée nationale et représente les collectivités territoriales. Cette seconde chambre contribue à l’examen et à la continuité du travail législatif.",
        en: "The Senate passes laws together with the National Assembly and represents local authorities. This second chamber contributes to legislative scrutiny and continuity."
      },
      {
        match: /président de la république/i,
        fr: "Le Président de la République veille au respect de la Constitution et au fonctionnement régulier des pouvoirs publics. Il dispose de compétences propres, tandis que le Gouvernement conduit la politique de la Nation.",
        en: "The President of the Republic safeguards the Constitution and the proper functioning of public authorities. The President has specific powers, while the Government determines and conducts national policy."
      },
      {
        match: /premier ministre|gouvernement/i,
        fr: "Le Gouvernement détermine et conduit la politique de la Nation. Le Premier ministre dirige son action et assure l’exécution des lois, sous le contrôle du Parlement.",
        en: "The Government determines and conducts national policy. The Prime Minister directs its work and ensures that laws are implemented, under parliamentary scrutiny."
      },
      {
        match: /école.*obligatoire|instruction obligatoire|lois scolaires|jules ferry/i,
        fr: "L’instruction obligatoire vise à garantir à tous les enfants l’accès aux connaissances nécessaires à leur autonomie et à leur citoyenneté. La gratuité et la laïcité de l’école publique soutiennent l’égalité d’accès.",
        en: "Compulsory education aims to give every child the knowledge needed for independence and citizenship. Free and secular state education supports equal access."
      },
      {
        match: /sécurité sociale|assurance maladie|carte vitale|tiers payant/i,
        fr: "La protection sociale mutualise les cotisations et contributions afin de prendre en charge collectivement certains risques, comme la maladie, la vieillesse ou les charges familiales. Elle facilite ainsi l’accès aux soins et à la solidarité nationale.",
        en: "Social protection pools contributions to cover risks collectively, including illness, old age and family costs. It therefore supports access to healthcare and national solidarity."
      },
      {
        match: /contrat de travail|smic|licenci|congé|grève|syndicat/i,
        fr: "Le droit du travail cherche à équilibrer la relation entre employeur et salarié. Il fixe des protections minimales et encadre les droits collectifs afin que l’activité professionnelle respecte la dignité et la sécurité de chacun.",
        en: "Employment law seeks to balance the relationship between employer and employee. It sets minimum protections and regulates collective rights so that working life respects everyone’s dignity and safety."
      },
      {
        match: /mariage|divorce|autorité parentale|enfant|naissance/i,
        fr: "Le droit de la famille organise les liens entre les personnes et protège particulièrement l’intérêt de l’enfant. Les démarches d’état civil donnent une existence juridique aux événements importants de la vie familiale.",
        en: "Family law organises relationships between people and gives particular protection to the child’s best interests. Civil-status procedures give legal recognition to major events in family life."
      },
      {
        match: /police|gendarmerie|samu|pompiers|numéro d['’]urgence/i,
        fr: "Les numéros d’urgence orientent rapidement l’appel vers le service compétent. Les connaître permet de gagner du temps et de transmettre les informations utiles lorsqu’une personne ou la sécurité publique est en danger.",
        en: "Emergency numbers quickly direct a call to the appropriate service. Knowing them saves time and helps provide useful information when a person or public safety is at risk."
      }
    ];
    const specific = rules.find(rule => rule.match.test(text));
    if (specific) return specific;
    const fallbacks = {
      t1: {
        fr: "Ce repère aide à comprendre comment les valeurs républicaines se traduisent concrètement dans les règles communes et dans le fonctionnement des services publics.",
        en: "This fact helps explain how republican values are put into practice through common rules and the operation of public services."
      },
      t2: {
        fr: "Cette distinction est importante car chaque institution possède des compétences précises. Les confondre conduit souvent à attribuer une décision au mauvais niveau de pouvoir.",
        en: "This distinction matters because each institution has specific powers. Confusing them often means attributing a decision to the wrong level of authority."
      },
      t3: {
        fr: "Ce principe recherche un équilibre entre la liberté individuelle, la protection des autres et le respect des règles communes applicables à tous.",
        en: "This principle seeks a balance between individual freedom, the protection of others, and common rules that apply to everyone."
      },
      t4: {
        fr: "Ce repère permet de replacer la réponse dans l’histoire ou le patrimoine commun. Comprendre son contexte évite de mémoriser isolément un simple nom ou une simple date.",
        en: "This fact places the answer within shared history or heritage. Understanding its context avoids memorising an isolated name or date."
      },
      t5: {
        fr: "Cette règle répond à une situation concrète de la vie en France. Elle indique quel droit, quel service ou quelle démarche utiliser dans la vie quotidienne.",
        en: "This rule addresses a practical situation in life in France. It identifies the right, service or procedure to use in everyday life."
      }
    };
    return fallbacks[q.theme] || fallbacks.t3;
  }

  function commonTrap(q) {
    const answer = q.answers?.[0] || q.choices?.[q.answer] || "";
    const text = `${q.q} ${answer}`;
    const rules = [
      {
        match: /laïcité|neutralité.*religion|signe religieux/i,
        fr: "Ne confondez pas la neutralité des services et agents publics avec la situation des usagers. Les agents représentent le service public et sont soumis à une obligation de neutralité ; les usagers disposent en principe de leur liberté religieuse, dans les limites nécessaires au bon fonctionnement du service.",
        en: "Do not confuse the neutrality required of public services and officials with the position of service users. Officials represent the public service and must remain neutral; users generally retain religious freedom, within the limits required for the service to operate properly."
      },
      {
        match: /assemblée nationale|sénat|parlement|député|sénateur/i,
        fr: "Ne confondez pas Parlement, Gouvernement et Président de la République. Le Parlement réunit l’Assemblée nationale et le Sénat ; il vote la loi et contrôle le Gouvernement.",
        en: "Do not confuse Parliament, the Government and the President of the Republic. Parliament consists of the National Assembly and the Senate; it passes legislation and scrutinises the Government."
      },
      {
        match: /président de la république|premier ministre|gouvernement/i,
        fr: "Attention à ne pas attribuer tous les pouvoirs au Président. La Constitution répartit les compétences entre le Président, le Gouvernement dirigé par le Premier ministre et le Parlement.",
        en: "Do not assume that all powers belong to the President. The Constitution divides responsibilities between the President, the Government led by the Prime Minister, and Parliament."
      },
      {
        match: /liberté d['’]expression|diffamation|haine|violence/i,
        fr: "« Liberté » ne signifie pas absence de limites. Une réponse affirmant que tout propos est autorisé est généralement fausse : la loi protège aussi les droits, la dignité et la sécurité d’autrui.",
        en: "Freedom does not mean the absence of limits. An answer claiming that every form of speech is permitted is generally wrong: the law also protects other people’s rights, dignity and safety."
      },
      {
        match: /impôt|impôts|services fiscaux|déclarer ses revenus/i,
        fr: "Ne confondez pas déclarer ses revenus et payer effectivement un impôt. Une déclaration peut être obligatoire même lorsque, après calcul, aucun impôt sur le revenu n’est dû.",
        en: "Do not confuse declaring income with actually paying tax. A tax return may be mandatory even when the calculation shows that no income tax is due."
      },
      {
        match: /union européenne|conseil de l['’]europe|parlement européen|commission européenne/i,
        fr: "Ne confondez pas l’Union européenne avec le Conseil de l’Europe, qui est une organisation distincte. Vérifiez aussi si la question porte sur la Commission, le Parlement européen ou une autre institution.",
        en: "Do not confuse the European Union with the Council of Europe, which is a separate organisation. Also check whether the question concerns the Commission, the European Parliament or another institution."
      },
      {
        match: /france métropolitaine|outre-mer|région|département|commune/i,
        fr: "Vérifiez toujours le périmètre demandé : France métropolitaine ou France entière, région ou département, collectivité territoriale ou service de l’État. Un chiffre juste dans un autre périmètre devient une mauvaise réponse.",
        en: "Always check the geographical or administrative scope: metropolitan France or the whole of France, region or department, local authority or State service. A number that is correct for a different scope becomes a wrong answer."
      },
      {
        match: /date|année|quand|depuis|siècle|guerre|révolution/i,
        fr: "Repérez précisément ce que la date désigne : début, fin, signature, adoption ou entrée en vigueur. Des événements proches peuvent avoir plusieurs dates importantes.",
        en: "Identify exactly what the date refers to: a beginning, an end, a signature, an adoption or an entry into force. Closely related events may have several important dates."
      },
      {
        match: /droit|devoir|obligatoire|interdit|autorisé|peut-on|possible/i,
        fr: "Distinguez une obligation légale, un droit et une simple recommandation. Les mots « doit », « peut » et « est interdit » ne sont pas interchangeables.",
        en: "Distinguish a legal obligation, a right and a simple recommendation. The words “must”, “may” and “is prohibited” are not interchangeable."
      },
      {
        match: /numéro d['’]urgence|samu|police|pompiers/i,
        fr: "Associez chaque numéro au bon service et à la bonne situation. Le 112 est le numéro d’urgence européen, mais les numéros français spécialisés restent à connaître.",
        en: "Match each number with the correct service and situation. 112 is the European emergency number, but the specialised French emergency numbers must also be known."
      }
    ];
    const specific = rules.find(rule => rule.match.test(text));
    if (specific) return specific;
    if (q.type === "situation") {
      return {
        fr: "Ne répondez pas selon une préférence personnelle. Identifiez d’abord le droit, le devoir ou le principe juridique réellement applicable à la situation.",
        en: "Do not answer according to personal preference. First identify the right, duty or legal principle that actually applies to the situation."
      };
    }
    const fallbacks = {
      t1: { fr: "Méfiez-vous des réponses absolues comme « toujours » ou « jamais » : les principes républicains s’appliquent souvent avec des garanties et des limites prévues par la loi.", en: "Be cautious with absolute answers such as “always” or “never”: republican principles often operate with safeguards and limits set by law." },
      t2: { fr: "Le piège le plus fréquent consiste à confondre les institutions. Repérez le verbe de la question — élire, nommer, voter, contrôler ou juger — pour identifier l’autorité compétente.", en: "The most common trap is confusing institutions. Focus on the verb in the question — elect, appoint, pass, scrutinise or judge — to identify the competent authority." },
      t3: { fr: "Un droit n’est pas nécessairement sans limite et un devoir ne s’applique pas toujours dans toutes les circonstances. Cherchez la règle précise plutôt qu’une affirmation trop générale.", en: "A right is not necessarily unlimited, and a duty does not always apply in every circumstance. Look for the precise rule rather than an overly broad statement." },
      t4: { fr: "Évitez d’associer un personnage, une œuvre ou un événement à la bonne période uniquement par intuition. Appuyez-vous sur un repère concret : date, régime politique, lieu ou réalisation.", en: "Avoid linking a person, work or event to a period based only on intuition. Use a concrete clue: a date, political system, place or achievement." },
      t5: { fr: "Distinguez la démarche obligatoire de la démarche simplement utile, ainsi que l’organisme public compétent. Une réponse plausible peut être fausse si elle désigne le mauvais interlocuteur.", en: "Distinguish a mandatory procedure from one that is merely useful, and identify the competent public body. A plausible answer may still be wrong if it names the wrong service." }
    };
    return fallbacks[q.theme] || fallbacks.t3;
  }

  function externalSource(q) {
    const singleAnswer = q.answers?.length === 1 ? q.answers[0] : q.choices?.[q.answer] || "";
    const haystack = `${q.q} ${singleAnswer}`;
    const note = contextNotes.find(item => item.match.test(haystack));
    if (note?.wiki) return { label: `Wikipédia — ${note.title}`, url: `https://fr.wikipedia.org/wiki/${note.wiki}` };
    return null;
  }

  function initialProgress() {
    return { known: [], review: [], seen: [], schedule: {}, practice: { answered: 0, correct: 0 }, exams: [], lastVisit: null };
  }

  function loadProgress() {
    try {
      return { ...initialProgress(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch (_) {
      return initialProgress();
    }
  }

  let progress = loadProgress();
  progress.schedule ||= {};
  progress.lastVisit = new Date().toISOString();
  saveProgress();

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function uniquePush(list, value) {
    if (!list.includes(value)) list.push(value);
  }

  function removeFrom(list, value) {
    const i = list.indexOf(value);
    if (i >= 0) list.splice(i, 1);
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function sample(items, count) {
    return shuffle(items).slice(0, count);
  }

  function getQuestion(id) {
    return cardQuestions.find(q => q.id === id) || qcmQuestions.find(q => q.id === id);
  }

  function percent(a, b) {
    return b ? Math.round((a / b) * 100) : 0;
  }

  function isDue(id) {
    const item = progress.schedule[id];
    return Boolean(item?.dueAt && new Date(item.dueAt).getTime() <= Date.now());
  }

  function cardStatus(id) {
    if (progress.known.includes(id)) return "✓ Maîtrisée";
    const item = progress.schedule[id];
    if (!progress.seen.includes(id)) return "Nouvelle";
    if (!item) return progress.review.includes(id) ? "À revoir" : "En apprentissage";
    if (isDue(id)) return item.lastRating === "again" ? "À revoir maintenant" : "Révision prévue aujourd’hui";
    if (item.repetitions >= 2) return "À consolider";
    return "En apprentissage";
  }

  function intervalForRating(id, rating) {
    const previous = progress.schedule[id]?.intervalDays || 0;
    if (rating === "again") return 0;
    if (rating === "hard") return previous ? Math.max(1, Math.round(previous * 1.25)) : 1;
    if (rating === "good") return previous ? Math.max(3, Math.round(previous * 2)) : 3;
    return previous ? Math.max(7, Math.round(previous * 2.5)) : 7;
  }

  function intervalLabel(id, rating) {
    if (rating === "again") return "Dans 10 min";
    const days = intervalForRating(id, rating);
    if (days === 1) return "Demain";
    return `Dans ${days} jours`;
  }

  function themeOptions(includeAll = true) {
    return `${includeAll ? '<option value="all">Tous les thèmes</option>' : ""}${Object.entries(themes).map(([id, t]) => `<option value="${id}">${t.name}</option>`).join("")}`;
  }

  function tag(q) {
    const t = themes[q.theme];
    return `<span class="tag" style="--theme-color:${t.color}">${t.short}</span> ${q.official ? '<span class="tag tag-official">Question officielle</span>' : ""} ${q.type === "situation" ? '<span class="tag tag-situation">Mise en situation · entraînement</span>' : ""}`;
  }

  function flashAnswer(q, showEnglish) {
    const note = pedagogicalNote(q);
    const why = whyExplanation(q);
    const trap = commonTrap(q);
    const external = externalSource(q);
    const externalLink = external ? `<a href="${external.url}" target="_blank" rel="noopener">${external.label} <span aria-hidden="true">↗</span></a>` : "";
    if (q.answers) {
      return `<div class="short-answer"><span>Réponse à retenir</span><strong>${q.answers[0]}</strong></div>${q.answers.length > 1 ? `<details class="accepted-answers"><summary>Voir les autres formulations admises</summary><ul>${q.answers.slice(1).map(a => `<li>${a}</li>`).join("")}</ul></details>` : ""}<section class="explanation-box" aria-live="polite"><div class="explanation-heading"><h3>${showEnglish ? "To understand" : "Pour comprendre"}</h3><button class="translation-button" id="toggle-translation" type="button" lang="${showEnglish ? "en" : "fr"}">${showEnglish ? "Lire en français" : "Read in English"}</button></div><p lang="${showEnglish ? "en" : "fr"}">${showEnglish ? note.en : note.fr}</p><p class="why-note" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Why?" : "Pourquoi ?"}</strong> ${showEnglish ? why.en : why.fr}</p><aside class="trap-box" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Common trap" : "Piège fréquent"}</strong><p>${showEnglish ? trap.en : trap.fr}</p></aside></section><div class="answer-sources"><a href="${sourceUrls[q.source]}" target="_blank" rel="noopener">Source de la question et attribution <span aria-hidden="true">↗</span></a>${externalLink}</div><p class="source-note">Réponse pédagogique indépendante proposée par leqcmcivique.fr ; l’administration ne publie pas de corrigé officiel.${external ? " La ressource Wikipédia apporte uniquement un contexte complémentaire." : ""}</p>`;
    }
    return `<div class="short-answer"><span>Réponse à retenir</span><strong>${q.choices[q.answer]}</strong></div><section class="explanation-box" aria-live="polite"><div class="explanation-heading"><h3>${showEnglish ? "To understand" : "Pour comprendre"}</h3><button class="translation-button" id="toggle-translation" type="button">${showEnglish ? "Lire en français" : "Read in English"}</button></div><p lang="${showEnglish ? "en" : "fr"}">${showEnglish ? note.en : q.explanation}</p><p class="why-note" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Why?" : "Pourquoi ?"}</strong> ${showEnglish ? why.en : why.fr}</p><aside class="trap-box" lang="${showEnglish ? "en" : "fr"}"><strong>${showEnglish ? "Common trap" : "Piège fréquent"}</strong><p>${showEnglish ? trap.en : trap.fr}</p></aside></section><div class="answer-sources"><a href="${sourceUrls[q.source]}" target="_blank" rel="noopener">Source officielle <span aria-hidden="true">↗</span></a>${externalLink}</div>`;
  }

  function alternateWording(question) {
    const rules = [
      [/^En quelle année (.+?)\s*\?$/i, "À quelle date $1 ?"],
      [/^Depuis quand (.+?)\s*\?$/i, "À partir de quelle date $1 ?"],
      [/^Quand (.+?)\s*\?$/i, "À quelle date ou période $1 ?"],
      [/^Où (.+?)\s*\?$/i, "Dans quel lieu $1 ?"],
      [/^À quoi sert le (.+?)\s*\?$/i, "Quelle est la fonction du $1 ?"],
      [/^À quoi sert la (.+?)\s*\?$/i, "Quelle est la fonction de la $1 ?"],
      [/^À quoi sert l[’'](.+?)\s*\?$/i, "Quelle est la fonction de l’$1 ?"],
      [/^À quoi sert un (.+?)\s*\?$/i, "Quelle est la fonction d’un $1 ?"],
      [/^À quoi sert une (.+?)\s*\?$/i, "Quelle est la fonction d’une $1 ?"],
      [/^Qu’est-ce que (.+?)\s*\?$/i, "Quelle définition donner à : « $1 » ?"],
      [/^Qu'est-ce que (.+?)\s*\?$/i, "Quelle définition donner à : « $1 » ?"],
      [/^Que signifie (.+?)\s*\?$/i, "Que veut dire $1 ?"],
      [/^Quel est le rôle (.+?)\s*\?$/i, "Quelle est la mission $1 ?"],
      [/^Quelle est la durée du mandat (.+?)\s*\?$/i, "Combien d’années dure le mandat $1 ?"],
      [/^Quelle est la durée de (.+?)\s*\?$/i, "Combien de temps dure $1 ?"],
      [/^Qui a peint (.+?)\s*\?$/i, "Quel artiste est l’auteur de $1 ?"],
      [/^Qui a composé (.+?)\s*\?$/i, "Quel compositeur est l’auteur de $1 ?"],
      [/^Qui peut (.+?)\s*\?$/i, "Qui est autorisé à $1 ?"],
      [/^Comment est désigné (.+?)\s*\?$/i, "De quelle manière $1 est-il désigné ?"],
      [/^Comment sont désignés (.+?)\s*\?$/i, "De quelle manière $1 sont-ils désignés ?"],
      [/^Quel numéro d’urgence permet d’appeler (.+?)\s*\?$/i, "Quel numéro faut-il composer pour joindre $1 en urgence ?"],
      [/^Quel numéro d'urgence permet d'appeler (.+?)\s*\?$/i, "Quel numéro faut-il composer pour joindre $1 en urgence ?"],
      [/^Quelle institution française (.+?)\s*\?$/i, "Quelle est l’institution française qui $1 ?"],
      [/^Quelle institution (.+?)\s*\?$/i, "Quelle est l’institution qui $1 ?"],
      [/^Quelle organisation (.+?)\s*\?$/i, "Quelle est l’organisation qui $1 ?"],
      [/^Combien y a-t-il de (.+?)\s*\?$/i, "Quel est le nombre de $1 ?"],
      [/^Est-ce obligatoire de (.+?)\s*\?$/i, "L’action suivante est-elle obligatoire : $1 ?"],
      [/^Est-ce légal de (.+?)\s*\?$/i, "La loi autorise-t-elle à $1 ?"],
      [/^Peut-on (.+?)\s*\?$/i, "Est-il permis de $1 ?"],
      [/^Est-il possible de (.+?)\s*\?$/i, "La loi permet-elle de $1 ?"]
    ];
    for (const [pattern, replacement] of rules) {
      if (pattern.test(question)) return question.replace(pattern, replacement);
    }
    return question;
  }

  function toast(message) {
    const el = document.querySelector("#toast");
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(() => el.classList.remove("show"), 2300);
  }

  function parseRoute() {
    const raw = location.hash.slice(2) || "";
    const [path, query = ""] = raw.split("?");
    return { path: path || "home", params: new URLSearchParams(query) };
  }

  function setActiveNav(path) {
    document.querySelectorAll("[data-nav]").forEach(link => {
      const active = path.startsWith(link.dataset.nav);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function layout(content, narrow = false) {
    app.innerHTML = `<div class="page ${narrow ? "page-narrow" : ""}">${content}</div>`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderHome() {
    const known = progress.known.length;
    const seen = progress.seen.length;
    const reviewCount = reviewableQuestions.filter(q => progress.review.includes(q.id) || isDue(q.id)).length;
    const best = progress.exams.length ? Math.max(...progress.exams.map(e => e.score)) : null;
    const last = progress.exams.at(-1);
    const themeCards = Object.entries(themes).map(([id, theme], index) => {
      const pool = cardQuestions.filter(q => q.theme === id);
      const officialCount = pool.filter(q => q.official).length;
      const situationCount = pool.filter(q => q.type === "situation").length;
      const mastered = pool.filter(q => progress.known.includes(q.id)).length;
      return `<a class="card card-link" style="--theme-color:${theme.color}" href="#/reviser?theme=${id}">
        <span class="card-icon">${index + 1}</span>
        <h3>${theme.name}</h3>
        <p>${officialCount} questions officielles${situationCount ? ` + ${situationCount} situations d’entraînement` : ""}</p>
        <p>${mastered} carte${mastered > 1 ? "s" : ""} maîtrisée${mastered > 1 ? "s" : ""} sur ${pool.length}</p>
        <div class="progress" aria-label="${percent(mastered, pool.length)} % maîtrisé"><span style="width:${percent(mastered, pool.length)}%"></span></div>
      </a>`;
    }).join("");

    layout(`
      <section class="hero">
        <div>
          <p class="eyebrow">Examen civique · Naturalisation</p>
          <h1>Les bons repères pour réussir.</h1>
          <p class="lead">Révisez à votre rythme avec des cartes simples, puis testez-vous dans les conditions de l’examen.</p>
          <div class="actions">
            <a class="button" href="#/reviser">Commencer à réviser <span aria-hidden="true">→</span></a>
            <a class="button button-secondary" href="#/examen">Passer un examen blanc</a>
          </div>
        </div>
        <aside class="hero-card" aria-label="Format officiel de l’examen">
          <span class="exam-number">40</span>
          <p>questions à choix multiples</p>
          <hr>
          <div class="exam-facts">
            <div><strong>45 min</strong><span>maximum</span></div>
            <div><strong>32/40</strong><span>pour réussir</span></div>
            <div><strong>5</strong><span>thématiques</span></div>
          </div>
        </aside>
      </section>

      <section class="section" aria-labelledby="progress-title">
        <div class="section-heading"><div><p class="eyebrow">Votre progression</p><h2 id="progress-title">Reprenez là où vous en étiez</h2></div></div>
        <div class="stat-grid">
          <div class="stat"><strong>${known}</strong><span>cartes maîtrisées</span></div>
          ${reviewCount ? `<a class="stat stat-link" href="#/reviser?filter=review" aria-label="Réviser les ${reviewCount} carte${reviewCount > 1 ? "s" : ""} à revoir"><strong>${reviewCount}</strong><span>carte${reviewCount > 1 ? "s" : ""} à revoir</span><small>Réviser maintenant <span aria-hidden="true">→</span></small></a>` : '<div class="stat stat-empty"><strong>0</strong><span>carte à revoir</span><small>Aucune carte en attente</small></div>'}
          <div class="stat"><strong>${seen}</strong><span>notions consultées</span></div>
          <div class="stat"><strong>${best === null ? "—" : `${best}/40`}</strong><span>meilleur examen</span></div>
        </div>
        ${last ? `<p>Dernier examen blanc : <strong>${last.score}/40</strong> le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(last.date))}.</p>` : ""}
      </section>

      <section class="section" aria-labelledby="themes-title">
        <div class="section-heading"><div><p class="eyebrow">Programme officiel</p><h2 id="themes-title">Réviser par thème</h2></div><a href="#/reviser">Voir toutes les cartes</a></div>
        <div class="grid">${themeCards}</div>
      </section>

      <section class="section">
        <div class="notice"><strong>Couverture intégrale</strong>Les 258 questions de connaissance publiées pour la naturalisation sont intégrées aux flashcards. Les réponses sont pédagogiques : l’administration publie les questions, mais pas de corrigé officiel.</div>
        <div class="notice notice-warning"><strong>Bon à savoir</strong>Les questions officielles de mise en situation ne sont pas publiques. Celles proposées ici sont des exercices originaux signalés comme tels.</div>
      </section>
    `);
  }

  function renderRevise(params) {
    const preset = params.get("theme") || "all";
    const presetFilter = params.get("filter") || "all";
    layout(`
      <p class="eyebrow">Mémoriser</p>
      <h1>Réviser avec les flashcards</h1>
      <p class="lead">Parcourez les 258 questions de connaissance de la liste officielle et les mises en situation d’entraînement. Après chaque réponse, indiquez votre niveau : la prochaine révision sera automatiquement programmée sur cet appareil.</p>
      <div class="toolbar">
        <div class="field"><label for="flash-theme">Thème</label><select id="flash-theme">${themeOptions()}</select></div>
        <div class="field"><label for="flash-filter">Cartes à afficher</label><select id="flash-filter"><option value="all">Toutes les cartes</option><option value="review">À revoir</option><option value="due">Prévues aujourd’hui</option><option value="unseen">Pas encore vues</option><option value="known">Maîtrisées</option></select></div>
        <div class="field"><label for="flash-wording">Formulation</label><select id="flash-wording"><option value="mixed">Mixte : officielle et reformulée</option><option value="official">Toujours officielle</option><option value="alternate">Reformulée si disponible</option></select></div>
        <button class="button" id="start-flash" type="button">Lancer la révision</button>
      </div>
      <div id="flash-zone"></div>
    `);
    document.querySelector("#flash-theme").value = themes[preset] ? preset : "all";
    document.querySelector("#flash-filter").value = ["all", "review", "due", "unseen", "known"].includes(presetFilter) ? presetFilter : "all";
    document.querySelector("#start-flash").addEventListener("click", startFlashcards);
    startFlashcards();
  }

  function startFlashcards() {
    const theme = document.querySelector("#flash-theme").value;
    const filter = document.querySelector("#flash-filter").value;
    const wording = document.querySelector("#flash-wording").value;
    let pool = (["review", "due"].includes(filter) ? reviewableQuestions : cardQuestions).filter(q => theme === "all" || q.theme === theme);
    if (filter === "review") pool = pool.filter(q => progress.review.includes(q.id) || isDue(q.id));
    if (filter === "due") pool = pool.filter(q => isDue(q.id));
    if (filter === "unseen") pool = pool.filter(q => !progress.seen.includes(q.id));
    if (filter === "known") pool = pool.filter(q => progress.known.includes(q.id));
    const ids = shuffle(pool).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      const useAlternate = wording === "alternate" || (wording === "mixed" && Math.random() < .5);
      return [id, useAlternate ? alternate : q.q];
    }));
    flashSession = { ids, wordings, translations: {}, index: 0, revealed: false };
    renderFlashcard();
  }

  function renderFlashcard() {
    const zone = document.querySelector("#flash-zone");
    if (!flashSession.ids.length) {
      zone.innerHTML = `<div class="empty"><h2>Aucune carte ici</h2><p>Essayez un autre filtre ou un autre thème.</p></div>`;
      return;
    }
    if (flashSession.index >= flashSession.ids.length) {
      zone.innerHTML = `<div class="result-hero" style="--result-color:var(--green)"><p class="eyebrow">Session terminée</p><h2>Révision enregistrée</h2><p>Les prochaines cartes seront proposées selon vos réponses et leur date de révision.</p><button class="button" id="restart-flash" type="button">Nouvelle session</button></div>`;
      document.querySelector("#restart-flash").addEventListener("click", startFlashcards);
      return;
    }
    const q = getQuestion(flashSession.ids[flashSession.index]);
    const displayedQuestion = flashSession.wordings[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    zone.innerHTML = `<div class="study-shell">
      <div class="study-meta"><span>Carte ${flashSession.index + 1} sur ${flashSession.ids.length}</span><span>${cardStatus(q.id)}</span></div>
      <div class="progress"><span style="width:${percent(flashSession.index + 1, flashSession.ids.length)}%"></span></div>
      <article class="flashcard" aria-labelledby="flash-question">
        <div class="flash-tags">${tag(q)} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div>
        <h2 id="flash-question">${displayedQuestion}</h2>
        ${flashSession.revealed ? `<div class="answer">${isReworded ? `<p class="official-wording"><strong>Formulation officielle :</strong> ${q.q}</p>` : ""}${flashAnswer(q, !!flashSession.translations[q.id])}</div>` : '<button class="button button-secondary reveal-button" id="flip-card" type="button" aria-expanded="false">Afficher la réponse</button>'}
      </article>
      ${flashSession.revealed ? `<fieldset class="rating-panel"><legend>Comment évaluez-vous votre réponse&nbsp;?</legend><div class="rating-grid">
        <button class="rating-button rating-again" data-rating="again" type="button"><strong>Je ne savais pas</strong><small>${intervalLabel(q.id, "again")}</small></button>
        <button class="rating-button rating-hard" data-rating="hard" type="button"><strong>Presque</strong><small>${intervalLabel(q.id, "hard")}</small></button>
        <button class="rating-button rating-good" data-rating="good" type="button"><strong>Je savais</strong><small>${intervalLabel(q.id, "good")}</small></button>
        <button class="rating-button rating-easy" data-rating="easy" type="button"><strong>Trop facile</strong><small>${intervalLabel(q.id, "easy")}</small></button>
      </div></fieldset>` : ""}
      <div class="study-controls">
        <button class="button button-ghost" id="prev-card" type="button" ${flashSession.index === 0 ? "disabled" : ""}>← Précédente</button>
        <button class="button button-ghost" id="next-card" type="button" ${flashSession.index === flashSession.ids.length - 1 ? "disabled" : ""}>Suivante →</button>
      </div>
    </div>`;
    document.querySelector("#flip-card")?.addEventListener("click", () => { flashSession.revealed = true; uniquePush(progress.seen, q.id); saveProgress(); renderFlashcard(); });
    document.querySelector("#toggle-translation")?.addEventListener("click", () => { flashSession.translations[q.id] = !flashSession.translations[q.id]; renderFlashcard(); });
    document.querySelector("#prev-card").addEventListener("click", () => { flashSession.index--; flashSession.revealed = false; renderFlashcard(); });
    document.querySelector("#next-card").addEventListener("click", () => { flashSession.index++; flashSession.revealed = false; renderFlashcard(); });
    document.querySelectorAll("[data-rating]").forEach(button => button.addEventListener("click", () => rateCard(q.id, button.dataset.rating)));
  }

  function rateCard(id, rating) {
    uniquePush(progress.seen, id);
    const wasKnown = progress.known.includes(id);
    const previous = progress.schedule[id] || { repetitions: 0, intervalDays: 0, lapses: 0 };
    const intervalDays = intervalForRating(id, rating);
    const repetitions = rating === "again" ? 0 : previous.repetitions + 1;
    const delay = rating === "again" ? 10 * 60 * 1000 : intervalDays * 24 * 60 * 60 * 1000;
    progress.schedule[id] = {
      repetitions,
      intervalDays,
      lapses: previous.lapses + (rating === "again" ? 1 : 0),
      lastRating: rating,
      lastReviewedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + delay).toISOString()
    };
    if (["again", "hard"].includes(rating)) uniquePush(progress.review, id);
    else removeFrom(progress.review, id);
    if ((wasKnown && ["good", "easy"].includes(rating)) || (repetitions >= 3 && intervalDays >= 14)) uniquePush(progress.known, id);
    else removeFrom(progress.known, id);
    if (rating === "again" && !flashSession.ids.slice(flashSession.index + 1).includes(id)) {
      flashSession.ids.splice(Math.min(flashSession.index + 4, flashSession.ids.length), 0, id);
    }
    saveProgress();
    const messages = {
      again: "Cette carte reviendra dans quelques minutes",
      hard: "Révision programmée pour demain",
      good: `Révision programmée dans ${intervalDays} jours`,
      easy: `Révision espacée de ${intervalDays} jours`
    };
    toast(messages[rating]);
    flashSession.index++;
    flashSession.revealed = false;
    renderFlashcard();
  }

  function renderPractice() {
    layout(`
      <p class="eyebrow">S’entraîner</p>
      <h1>Entraînement QCM</h1>
      <p class="lead">Choisissez une série courte. La correction et l’explication apparaissent après chaque réponse.</p>
      <div class="toolbar">
        <div class="field"><label for="practice-theme">Thème</label><select id="practice-theme">${themeOptions()}</select></div>
        <div class="field"><label for="practice-count">Nombre de questions</label><select id="practice-count"><option>5</option><option selected>10</option><option>20</option></select></div>
        <button class="button" id="start-practice" type="button">Commencer</button>
      </div>
      <div id="practice-zone"></div>
    `);
    document.querySelector("#start-practice").addEventListener("click", startPractice);
  }

  function startPractice() {
    const theme = document.querySelector("#practice-theme").value;
    const count = Number(document.querySelector("#practice-count").value);
    const pool = qcmQuestions.filter(q => theme === "all" || q.theme === theme);
    const ids = sample(pool, Math.min(count, pool.length)).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      return [id, alternate !== q.q && Math.random() < .5 ? alternate : q.q];
    }));
    practiceSession = { ids, wordings, index: 0, answers: [], score: 0, revealed: false };
    renderPracticeQuestion();
  }

  function renderPracticeQuestion() {
    const zone = document.querySelector("#practice-zone");
    if (practiceSession.index >= practiceSession.ids.length) {
      zone.innerHTML = `<div class="result-hero" style="--result-color:${practiceSession.score >= practiceSession.ids.length * .8 ? "var(--green)" : "var(--orange)"}">
        <p class="eyebrow">Série terminée</p><h2>${practiceSession.score}/${practiceSession.ids.length} bonnes réponses</h2>
        <p>${practiceSession.score >= practiceSession.ids.length * .8 ? "Très bon résultat. Continuez à consolider vos acquis." : "Repérez les notions à revoir, puis tentez une nouvelle série."}</p>
        <button class="button" id="restart-practice" type="button">Nouvelle série</button>
      </div>`;
      document.querySelector("#restart-practice").addEventListener("click", startPractice);
      return;
    }
    const q = getQuestion(practiceSession.ids[practiceSession.index]);
    const displayedQuestion = practiceSession.wordings[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    const selected = practiceSession.answers[practiceSession.index];
    zone.innerHTML = `<div class="question-shell">
      <div class="question-topbar"><span>Question ${practiceSession.index + 1}/${practiceSession.ids.length}</span><strong>${practiceSession.score} bonne${practiceSession.score > 1 ? "s" : ""} réponse${practiceSession.score > 1 ? "s" : ""}</strong></div>
      <div class="progress"><span style="width:${percent(practiceSession.index, practiceSession.ids.length)}%"></span></div>
      <article class="question-card">
        <div>${tag(q)} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div><h2>${displayedQuestion}</h2>
        <div class="choices">${q.choices.map((choice, i) => `<button class="choice ${practiceSession.revealed ? (i === q.answer ? "correct" : i === selected ? "incorrect" : "") : ""}" data-choice="${i}" type="button" ${practiceSession.revealed ? "disabled" : ""}><span class="choice-letter">${LETTERS[i]}</span><span>${choice}</span></button>`).join("")}</div>
        ${practiceSession.revealed ? `<div class="feedback ${selected === q.answer ? "" : "incorrect"}"><strong>${selected === q.answer ? "Bonne réponse" : "Réponse incorrecte"}</strong>${isReworded ? `<p><strong>Formulation d’origine :</strong> ${q.q}</p>` : ""}<p>${q.explanation}</p><a href="${sourceUrls[q.source]}" target="_blank" rel="noopener">Voir la source officielle ↗</a></div>` : ""}
        <div class="question-nav"><span></span>${practiceSession.revealed ? '<button class="button" id="practice-next" type="button">Question suivante →</button>' : ""}</div>
      </article>
    </div>`;
    document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => answerPractice(Number(btn.dataset.choice))));
    document.querySelector("#practice-next")?.addEventListener("click", () => { practiceSession.index++; practiceSession.revealed = false; renderPracticeQuestion(); });
  }

  function answerPractice(choice) {
    const q = getQuestion(practiceSession.ids[practiceSession.index]);
    practiceSession.answers[practiceSession.index] = choice;
    practiceSession.revealed = true;
    practiceSession.score += choice === q.answer ? 1 : 0;
    progress.practice.answered++;
    progress.practice.correct += choice === q.answer ? 1 : 0;
    uniquePush(progress.seen, q.id);
    if (choice !== q.answer) uniquePush(progress.review, q.id);
    saveProgress();
    renderPracticeQuestion();
  }

  function createExam() {
    const pool = (theme, type) => qcmQuestions.filter(q => q.theme === theme && q.type === type);
    const picked = [
      ...sample(pool("t1", "knowledge"), 5), ...sample(pool("t1", "situation"), 6),
      ...sample(pool("t2", "knowledge"), 6),
      ...sample(pool("t3", "knowledge"), 5), ...sample(pool("t3", "situation"), 6),
      ...sample(pool("t4", "knowledge"), 8), ...sample(pool("t5", "knowledge"), 4)
    ];
    const ids = shuffle(picked).map(q => q.id);
    const wordings = Object.fromEntries(ids.map(id => {
      const q = getQuestion(id);
      const alternate = alternateWording(q.q);
      return [id, alternate !== q.q && Math.random() < .35 ? alternate : q.q];
    }));
    return { ids, wordings, answers: {}, flagged: [], index: 0, startedAt: Date.now(), duration: 45 * 60 * 1000 };
  }

  function loadExam() {
    try { return JSON.parse(localStorage.getItem(EXAM_KEY) || "null"); } catch (_) { return null; }
  }

  function saveExam(exam) {
    localStorage.setItem(EXAM_KEY, JSON.stringify(exam));
  }

  function renderExamLanding() {
    const active = loadExam();
    layout(`
      <p class="eyebrow">Conditions réelles</p>
      <h1>Examen blanc</h1>
      <p class="lead">Un tirage de 40 questions, 45 minutes et une seule bonne réponse par question.</p>
      ${active ? '<div class="notice"><strong>Une session est en cours</strong>Vous pouvez reprendre exactement là où vous vous êtes arrêté.</div>' : ""}
      <div class="grid">
        <div class="card"><span class="card-icon">40</span><h3>40 questions</h3><p>Selon la répartition officielle entre les cinq thèmes.</p></div>
        <div class="card"><span class="card-icon">45</span><h3>45 minutes</h3><p>Le chronomètre continue si vous rechargez la page.</p></div>
        <div class="card"><span class="card-icon">80</span><h3>80 % requis</h3><p>Il faut obtenir au moins 32 réponses correctes.</p></div>
      </div>
      <div class="notice notice-warning"><strong>Simulation pédagogique</strong>Les questions de connaissance s’appuient sur la liste publique. Les mises en situation sont des entraînements originaux, car les questions officielles correspondantes ne sont pas publiées.</div>
      <div class="actions">
        ${active ? '<button class="button" id="resume-exam" type="button">Reprendre l’examen</button><button class="button button-secondary" id="new-exam" type="button">Recommencer</button>' : '<button class="button" id="new-exam" type="button">Démarrer l’examen</button>'}
      </div>
    `, true);
    document.querySelector("#resume-exam")?.addEventListener("click", renderExamSession);
    document.querySelector("#new-exam")?.addEventListener("click", () => {
      if (active && !confirm("Recommencer supprimera la session actuelle. Continuer ?")) return;
      saveExam(createExam());
      renderExamSession();
    });
  }

  function renderExamSession() {
    let exam = loadExam();
    if (!exam) { renderExamLanding(); return; }
    if (Date.now() - exam.startedAt >= exam.duration) { finishExam(true); return; }
    const q = getQuestion(exam.ids[exam.index]);
    const displayedQuestion = exam.wordings?.[q.id] || q.q;
    const isReworded = displayedQuestion !== q.q;
    const selected = exam.answers[q.id];
    layout(`<div class="question-shell">
      <div class="question-topbar"><div><strong>Examen blanc</strong><br><span>Question ${exam.index + 1} sur 40</span></div><span class="timer" id="exam-timer" role="timer">45:00</span></div>
      <div class="progress"><span style="width:${percent(Object.keys(exam.answers).length, 40)}%"></span></div>
      <div class="exam-map" aria-label="Navigation entre les questions">${exam.ids.map((id, i) => `<button type="button" data-exam-index="${i}" class="${i === exam.index ? "current" : ""} ${exam.answers[id] !== undefined ? "answered" : ""} ${exam.flagged.includes(id) ? "flagged" : ""}" aria-label="Question ${i + 1}${exam.answers[id] !== undefined ? ", répondue" : ""}">${i + 1}</button>`).join("")}</div>
      <article class="question-card">
        <div>${tag(q)} ${isReworded ? '<span class="tag tag-reworded">Formulation d’entraînement</span>' : ""}</div><h2>${displayedQuestion}</h2>
        <div class="choices">${q.choices.map((choice, i) => `<button class="choice ${selected === i ? "selected" : ""}" data-exam-choice="${i}" type="button"><span class="choice-letter">${LETTERS[i]}</span><span>${choice}</span></button>`).join("")}</div>
        <button class="flag-button" id="flag-question" type="button">${exam.flagged.includes(q.id) ? "Retirer le repère" : "Marquer pour y revenir"}</button>
        <div class="question-nav">
          <button class="button button-ghost" id="exam-prev" type="button" ${exam.index === 0 ? "disabled" : ""}>← Précédente</button>
          ${exam.index === 39 ? '<button class="button" id="finish-exam" type="button">Terminer l’examen</button>' : '<button class="button" id="exam-next" type="button">Suivante →</button>'}
        </div>
      </article>
    </div>`, true);
    startTimer();
    document.querySelectorAll("[data-exam-choice]").forEach(btn => btn.addEventListener("click", () => {
      exam = loadExam(); exam.answers[q.id] = Number(btn.dataset.examChoice); saveExam(exam); renderExamSession();
    }));
    document.querySelectorAll("[data-exam-index]").forEach(btn => btn.addEventListener("click", () => { exam = loadExam(); exam.index = Number(btn.dataset.examIndex); saveExam(exam); renderExamSession(); }));
    document.querySelector("#exam-prev").addEventListener("click", () => { exam = loadExam(); exam.index--; saveExam(exam); renderExamSession(); });
    document.querySelector("#exam-next")?.addEventListener("click", () => { exam = loadExam(); exam.index++; saveExam(exam); renderExamSession(); });
    document.querySelector("#flag-question").addEventListener("click", () => {
      exam = loadExam(); exam.flagged.includes(q.id) ? removeFrom(exam.flagged, q.id) : uniquePush(exam.flagged, q.id); saveExam(exam); renderExamSession();
    });
    document.querySelector("#finish-exam")?.addEventListener("click", () => {
      const unanswered = 40 - Object.keys(loadExam().answers).length;
      if (!unanswered || confirm(`Il reste ${unanswered} question${unanswered > 1 ? "s" : ""} sans réponse. Terminer quand même ?`)) finishExam(false);
    });
  }

  function startTimer() {
    clearInterval(timerId);
    const update = () => {
      const exam = loadExam();
      if (!exam) { clearInterval(timerId); return; }
      const left = Math.max(0, exam.duration - (Date.now() - exam.startedAt));
      const minutes = Math.floor(left / 60000);
      const seconds = Math.floor((left % 60000) / 1000);
      const timer = document.querySelector("#exam-timer");
      if (timer) {
        timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        timer.classList.toggle("warning", left < 5 * 60000);
      }
      if (!left) { clearInterval(timerId); finishExam(true); }
    };
    update(); timerId = window.setInterval(update, 1000);
  }

  function finishExam(timeUp) {
    clearInterval(timerId);
    const exam = loadExam();
    if (!exam) return;
    const score = exam.ids.reduce((sum, id) => sum + (exam.answers[id] === getQuestion(id).answer ? 1 : 0), 0);
    const result = { date: new Date().toISOString(), score, ids: exam.ids, answers: exam.answers, timeUp };
    progress.exams.push({ date: result.date, score });
    if (progress.exams.length > 20) progress.exams = progress.exams.slice(-20);
    exam.ids.forEach(id => {
      uniquePush(progress.seen, id);
      if (exam.answers[id] !== getQuestion(id).answer) uniquePush(progress.review, id);
    });
    saveProgress();
    localStorage.removeItem(EXAM_KEY);
    sessionStorage.setItem("cap-citoyen-last-result", JSON.stringify(result));
    location.hash = "#/resultats";
  }

  function renderResults() {
    let result;
    try { result = JSON.parse(sessionStorage.getItem("cap-citoyen-last-result") || "null"); } catch (_) { result = null; }
    if (!result) { location.hash = "#/examen"; return; }
    const passed = result.score >= 32;
    const breakdown = Object.entries(themes).map(([id, theme]) => {
      const ids = result.ids.filter(qid => getQuestion(qid).theme === id);
      const correct = ids.filter(qid => result.answers[qid] === getQuestion(qid).answer).length;
      return `<div class="breakdown-row"><span>${theme.short}</span><div class="progress" style="--theme-color:${theme.color}"><span style="width:${percent(correct, ids.length)}%"></span></div><strong>${correct}/${ids.length}</strong></div>`;
    }).join("");
    const review = result.ids.map((id, index) => {
      const q = getQuestion(id); const choice = result.answers[id]; const good = choice === q.answer;
      return `<article class="review-item ${good ? "good" : "bad"}"><div>${tag(q)}</div><h3>${index + 1}. ${q.q}</h3><p><strong>Votre réponse :</strong> ${choice === undefined ? "Aucune réponse" : q.choices[choice]}</p>${!good ? `<p><strong>Bonne réponse :</strong> ${q.choices[q.answer]}</p>` : ""}<p>${q.explanation}</p></article>`;
    }).join("");
    layout(`
      <div class="result-hero" style="--result-color:${passed ? "var(--green)" : "var(--orange)"}">
        <div class="score-ring" style="--score:${percent(result.score, 40)}%"><strong>${result.score}/40</strong></div>
        <p class="eyebrow">${result.timeUp ? "Temps écoulé · " : ""}Résultat</p>
        <h1>${passed ? "Examen blanc réussi" : "Encore un effort"}</h1>
        <p>${passed ? "Vous avez atteint le seuil de 80 %. Continuez à réviser pour stabiliser ce résultat." : `Il vous manque ${32 - result.score} bonne${32 - result.score > 1 ? "s" : ""} réponse${32 - result.score > 1 ? "s" : ""} pour atteindre le seuil.`}</p>
        <div class="actions" style="justify-content:center"><a class="button" href="#/examen">Nouvel examen</a><a class="button button-secondary" href="#/reviser?filter=review">Réviser mes erreurs</a></div>
      </div>
      <section class="breakdown"><h2>Résultat par thème</h2>${breakdown}</section>
      <section class="section"><div class="section-heading"><h2>Correction détaillée</h2></div><div class="review-list">${review}</div></section>
    `);
  }

  function renderSources() {
    layout(`
      <p class="eyebrow">Transparence</p>
      <h1>Sources officielles</h1>
      <p class="lead">Le contenu pédagogique a été élaboré à partir des documents officiels disponibles au 23 octobre 2026.</p>
      <div class="source-list">
        <article class="source-item"><h3>${sources.livret}</h3><p>Socle de connaissances sur les valeurs, l’histoire, les institutions et la vie en France.</p><a href="${sourceUrls.livret}" target="_blank" rel="noopener">Consulter sur Légifrance ↗</a></article>
        <article class="source-item"><h3>${sources.arrete}</h3><p>Format du QCM, durée, seuil de réussite et répartition des questions.</p><a href="${sourceUrls.arrete}" target="_blank" rel="noopener">Consulter sur Légifrance ↗</a></article>
        <article class="source-item"><h3>${sources.questions}</h3><p>Intitulés publics des questions de connaissance classés par thème.</p><a href="${sourceUrls.questions}" target="_blank" rel="noopener">Consulter sur le site du ministère ↗</a></article>
        <article class="source-item"><h3>${sources.procedure}</h3><p>Informations pratiques concernant l’examen et l’accès à la nationalité française.</p><a href="${sourceUrls.procedure}" target="_blank" rel="noopener">Consulter sur le site du ministère ↗</a></article>
        <article class="source-item"><h3>Jeu de données structuré et réponses pédagogiques</h3><p>Les 258 intitulés sont issus de la liste ministérielle. Les réponses proposées par leqcmcivique.fr sont indépendantes et diffusées sous Licence Ouverte 2.0.</p><a href="${sourceUrls.officialData}" target="_blank" rel="noopener">Consulter sur data.gouv.fr ↗</a></article>
        <article class="source-item"><h3>Ressources d’approfondissement</h3><p>Un lien Wikipédia est proposé uniquement lorsqu’un article précis a été associé à la notion. Les recherches automatiques trop larges ont été supprimées. Cette ressource encyclopédique complète la révision, mais ne remplace jamais les textes officiels.</p><a href="https://fr.wikipedia.org" target="_blank" rel="noopener">Consulter Wikipédia ↗</a></article>
      </div>
      <div class="notice notice-warning"><strong>Important</strong>Cap Citoyen est un outil indépendant et non officiel. Les mises en situation proposées sont des créations pédagogiques : les questions officielles de mise en situation ne sont pas rendues publiques.</div>
    `, true);
  }

  function renderNotFound() {
    layout('<div class="empty"><p class="eyebrow">Erreur 404</p><h1>Cette page n’existe pas</h1><a class="button" href="#/">Retour à l’accueil</a></div>', true);
  }

  function router() {
    clearInterval(timerId);
    const { path, params } = parseRoute();
    setActiveNav(path);
    if (path === "home") renderHome();
    else if (path === "reviser") renderRevise(params);
    else if (path === "entrainement") renderPractice();
    else if (path === "examen") renderExamLanding();
    else if (path === "resultats") renderResults();
    else if (path === "sources") renderSources();
    else renderNotFound();
    document.querySelector("#main").focus({ preventScroll: true });
  }

  function setupTheme() {
    const saved = localStorage.getItem("cap-citoyen-theme");
    const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    updateThemeLabel();
  }

  function updateThemeLabel() {
    const button = document.querySelector(".theme-toggle");
    const dark = document.documentElement.dataset.theme === "dark";
    button.setAttribute("aria-label", dark ? "Activer le thème clair" : "Activer le thème sombre");
  }

  document.querySelector(".theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cap-citoyen-theme", next);
    updateThemeLabel();
  });

  document.querySelector("#reset-progress").addEventListener("click", () => {
    if (!confirm("Supprimer toute la progression enregistrée sur cet appareil ?")) return;
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(EXAM_KEY); sessionStorage.removeItem("cap-citoyen-last-result");
    progress = initialProgress(); saveProgress(); toast("Progression réinitialisée"); location.hash = "#/"; router();
  });

  window.addEventListener("hashchange", router);
  setupTheme();
  if (!location.hash) location.hash = "#/";
  else router();
})();
