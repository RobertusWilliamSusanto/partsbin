import ImagePicker from './ImagePicker';

// Subkomponen form informasi dasar proyek (Nama, Deskripsi, dan Pemilih Sampul)
export default function CalculatorProjectInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  coverFile,
  onCoverChange,
  onCoverRemove,
  disabled,
}) {
  return (
    <div className="card stack-md">
      <h2 className="card-title">Informasi Proyek</h2>
      <div className="form-group">
        <label className="form-label" htmlFor="calc-proj-name">
          Nama Proyek
        </label>
        <input
          id="calc-proj-name"
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Contoh: Weather Station IoT ESP32"
          disabled={disabled}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="calc-proj-desc">
          Deskripsi Proyek (Opsional)
        </label>
        <textarea
          id="calc-proj-desc"
          className="form-textarea"
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Catatan fungsi, target casing, atau spesifikasi catu daya..."
          disabled={disabled}
        />
      </div>

      <ImagePicker
        file={coverFile}
        onChange={onCoverChange}
        onRemove={onCoverRemove}
        disabled={disabled}
      />
    </div>
  );
}
