import mongoose from 'mongoose';

const { Schema } = mongoose;

const clinicStateSchema = new Schema(
  {
    stateKey: {
      type: String,
      required: true,
      unique: true,
      default: 'primary'
    },
    appointments: {
      type: [Schema.Types.Mixed],
      default: []
    },
    patients: {
      type: [Schema.Types.Mixed],
      default: []
    },
    medicines: {
      type: [Schema.Types.Mixed],
      default: []
    },
    templates: {
      type: [Schema.Types.Mixed],
      default: []
    },
    procedures: {
      type: [Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true,
    minimize: false
  }
);

export const ClinicState = mongoose.models.ClinicState || mongoose.model('ClinicState', clinicStateSchema);