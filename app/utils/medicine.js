const normalizeMedicineText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeMedicineKey = (value) => normalizeMedicineText(value).toLowerCase();

export const sanitizeMedicineDraft = (draft = {}) => ({
    ...draft,
    name: normalizeMedicineText(draft.name),
    type: normalizeMedicineText(draft.type) || 'Tablet',
    content: normalizeMedicineText(draft.content)
});

export const findMatchingMedicine = (medicines = [], draft = {}, excludeId = null) => {
    const sanitizedDraft = sanitizeMedicineDraft(draft);
    const targetName = normalizeMedicineKey(sanitizedDraft.name);
    const targetType = normalizeMedicineKey(sanitizedDraft.type);
    const targetContent = normalizeMedicineKey(sanitizedDraft.content);

    return medicines.find((item) => {
        if (excludeId !== null && item.id === excludeId) {
            return false;
        }

        return normalizeMedicineKey(item.name) === targetName
            && normalizeMedicineKey(item.type) === targetType
            && normalizeMedicineKey(item.content) === targetContent;
    }) || null;
};

export const buildMedicineRecord = (draft = {}) => ({
    id: Date.now(),
    ...sanitizeMedicineDraft(draft)
});