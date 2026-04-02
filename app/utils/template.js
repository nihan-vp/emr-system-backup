const normalizeTemplateText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeTemplateKey = (value) => normalizeTemplateText(value).toLowerCase();

const sanitizeTemplateMedicine = (medicine = {}) => ({
    ...medicine,
    name: normalizeTemplateText(medicine.name),
    content: normalizeTemplateText(medicine.content),
    type: normalizeTemplateText(medicine.type) || 'Tablet',
    dosage: normalizeTemplateText(medicine.dosage),
    freq: normalizeTemplateText(medicine.freq),
    duration: normalizeTemplateText(medicine.duration),
    instruction: normalizeTemplateText(medicine.instruction)
});

const sanitizeTemplateProcedure = (item = {}) => ({
    ...item,
    name: normalizeTemplateText(item.name),
    category: normalizeTemplateText(item.category) || 'General',
    cost: normalizeTemplateText(item.cost)
});

const buildMedicineTemplateKey = (medicine = {}) => ([
    medicine.inventoryId || '',
    normalizeTemplateKey(medicine.name),
    normalizeTemplateKey(medicine.type),
    normalizeTemplateKey(medicine.content),
    normalizeTemplateKey(medicine.dosage),
    normalizeTemplateKey(medicine.freq),
    normalizeTemplateKey(medicine.duration),
    normalizeTemplateKey(medicine.instruction),
    medicine.isTapering ? '1' : '0'
].join('|'));

const buildProcedureTemplateKey = (item = {}) => ([
    normalizeTemplateKey(item.name),
    normalizeTemplateKey(item.category),
    normalizeTemplateKey(item.cost)
].join('|'));

const mergeUniqueItems = (existingItems = [], incomingItems = [], getKey) => {
    const merged = [...existingItems];
    const seen = new Set(existingItems.map((item) => getKey(item)));

    incomingItems.forEach((item) => {
        const key = getKey(item);

        if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
        }
    });

    return merged;
};

export const sanitizeTemplateDraft = (draft = {}) => ({
    ...draft,
    name: normalizeTemplateText(draft.name),
    diagnosis: normalizeTemplateText(draft.diagnosis),
    advice: normalizeTemplateText(draft.advice),
    referral: normalizeTemplateText(draft.referral),
    medicines: Array.isArray(draft.medicines)
        ? draft.medicines.map(sanitizeTemplateMedicine).filter((item) => item.name)
        : [],
    procedures: Array.isArray(draft.procedures)
        ? draft.procedures.map(sanitizeTemplateProcedure).filter((item) => item.name)
        : [],
    nextVisitInvestigations: Array.isArray(draft.nextVisitInvestigations)
        ? draft.nextVisitInvestigations.map(sanitizeTemplateProcedure).filter((item) => item.name)
        : []
});

export const hasTemplateContent = (draft = {}) => {
    const sanitizedDraft = sanitizeTemplateDraft(draft);

    return Boolean(
        sanitizedDraft.diagnosis
        || sanitizedDraft.advice
        || sanitizedDraft.referral
        || sanitizedDraft.medicines.length > 0
        || sanitizedDraft.procedures.length > 0
        || sanitizedDraft.nextVisitInvestigations.length > 0
    );
};

export const buildTemplateRecord = (draft = {}) => ({
    id: draft.id ?? Date.now(),
    ...sanitizeTemplateDraft(draft)
});

export const findMatchingTemplate = (templates = [], draft = {}, excludeId = null) => {
    const sanitizedDraft = sanitizeTemplateDraft(draft);
    const targetName = normalizeTemplateKey(sanitizedDraft.name);

    if (!targetName) {
        return null;
    }

    return templates.find((item) => {
        if (excludeId !== null && item.id === excludeId) {
            return false;
        }

        return normalizeTemplateKey(item.name) === targetName;
    }) || null;
};

export const createTemplateCopyName = (templates = [], sourceName = 'Template') => {
    const normalizedSourceName = normalizeTemplateText(sourceName) || 'Template';
    const baseName = `${normalizedSourceName} Copy`;

    if (!findMatchingTemplate(templates, { name: baseName })) {
        return baseName;
    }

    let index = 2;

    while (findMatchingTemplate(templates, { name: `${baseName} ${index}` })) {
        index += 1;
    }

    return `${baseName} ${index}`;
};

export const mergeTemplateIntoDraft = (draft = {}, template = {}) => {
    const sanitizedDraft = sanitizeTemplateDraft(draft);
    const sanitizedTemplate = sanitizeTemplateDraft(template);

    return {
        ...sanitizedDraft,
        diagnosis: sanitizedTemplate.diagnosis || sanitizedDraft.diagnosis,
        advice: sanitizedTemplate.advice || sanitizedDraft.advice,
        referral: sanitizedTemplate.referral || sanitizedDraft.referral,
        medicines: mergeUniqueItems(sanitizedDraft.medicines, sanitizedTemplate.medicines, buildMedicineTemplateKey),
        procedures: mergeUniqueItems(sanitizedDraft.procedures, sanitizedTemplate.procedures, buildProcedureTemplateKey),
        nextVisitInvestigations: mergeUniqueItems(sanitizedDraft.nextVisitInvestigations, sanitizedTemplate.nextVisitInvestigations, buildProcedureTemplateKey)
    };
};