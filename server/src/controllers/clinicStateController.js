import mongoose from 'mongoose';

import { ClinicState } from '../models/ClinicState.js';
import { defaultClinicState, ensureClinicState, resetClinicState } from '../seed/defaultClinicState.js';

const editableCollections = new Set(Object.keys(defaultClinicState));

const sanitizeState = (stateDocument) => {
  if (!stateDocument) {
    return null;
  }

  return {
    appointments: stateDocument.appointments || [],
    patients: stateDocument.patients || [],
    medicines: stateDocument.medicines || [],
    templates: stateDocument.templates || [],
    procedures: stateDocument.procedures || []
  };
};

export const getHealth = (_request, response) => {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  response.json({
    ok: true,
    database: readyStateMap[mongoose.connection.readyState] || 'unknown'
  });
};

export const getClinicState = async (_request, response) => {
  const state = await ensureClinicState();

  response.json({
    ok: true,
    data: sanitizeState(state)
  });
};

export const replaceClinicCollection = async (request, response) => {
  const { collection } = request.params;
  const items = Array.isArray(request.body) ? request.body : request.body.items;

  if (!editableCollections.has(collection)) {
    return response.status(400).json({
      ok: false,
      message: `Unknown collection: ${collection}`
    });
  }

  if (!Array.isArray(items)) {
    return response.status(400).json({
      ok: false,
      message: 'Request body must contain an array payload.'
    });
  }

  await ensureClinicState();

  const updatedState = await ClinicState.findOneAndUpdate(
    { stateKey: 'primary' },
    { $set: { [collection]: items } },
    { new: true }
  ).lean();

  return response.json({
    ok: true,
    data: {
      collection,
      items: updatedState?.[collection] || []
    }
  });
};

export const resetClinicCollections = async (_request, response) => {
  const state = await resetClinicState();

  response.json({
    ok: true,
    data: sanitizeState(state)
  });
};