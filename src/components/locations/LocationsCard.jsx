"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Phone, Plus, Trash2, UserPlus } from "lucide-react";
import api from "@/utils/api";
import Modal from "@/components/ui/Modal";

const KIND_LABELS = { emergency: "Emergencia", family: "Familia", doctor: "Médico", other: "Otro" };

/**
 * LocationsCard — places where the patient stays (home, hospital, residence…)
 * with emergency contacts per place (SPEC §4.13). The latest move is the
 * current location, shown at the top. Owners manage places/contacts;
 * caregivers can record a move.
 */
export default function LocationsCard({ patientId, isOwner, canEdit }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [moveTo, setMoveTo] = useState("");
  const [saving, setSaving] = useState(false);

  // location form modal
  const [locModal, setLocModal] = useState(null); // { id?, name, address, notes }
  // contact form modal
  const [contactModal, setContactModal] = useState(null); // { locationId, id?, name, phone, kind }

  const load = () =>
    api.getLocations(patientId).then(setData).catch((err) => setError(err.message));

  useEffect(() => {
    let cancelled = false;
    api
      .getLocations(patientId)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [patientId]);

  const saveLocation = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (locModal.id) await api.updateLocation(patientId, locModal.id, locModal);
      else await api.createLocation(patientId, locModal);
      setLocModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeLocation = async (locationId) => {
    setError("");
    try {
      await api.deleteLocation(patientId, locationId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { locationId, id, ...rest } = contactModal;
      if (id) await api.updateContact(patientId, locationId, id, rest);
      else await api.addContact(patientId, locationId, rest);
      setContactModal(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (locationId, contactId) => {
    setError("");
    try {
      await api.deleteContact(patientId, locationId, contactId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const move = async (toLocationId) => {
    if (!toLocationId || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.createMove(patientId, { toLocationId });
      setMoveTo("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return null;

  const setField = (setter) => (e) => setter((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm" aria-labelledby="locations-heading">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin className="size-5" /></span>
        <h2 id="locations-heading" className="text-base font-semibold">Lugares</h2>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {/* Current location */}
      <div className="mt-3 rounded-xl border border-border bg-background p-3">
        <p className="text-xs font-medium text-muted-foreground">Dónde está hoy</p>
        <p className="mt-0.5 text-lg font-semibold leading-tight text-foreground">
          {data.current ? data.current.name : "Sin asignar"}
        </p>
        {canEdit && data.locations.length > 0 && (
          <div className="mt-2 flex gap-2">
            <select
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              aria-label="Mover a lugar"
            >
              <option value="">Mover a…</option>
              {data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => move(moveTo)}
              disabled={!moveTo || saving}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="Registrar traslado"
            >
              <MapPin className="size-5" />
            </button>
          </div>
        )}
      </div>

      {/* Locations */}
      {data.locations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay lugares. Añade el primero.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {data.locations.map((l) => (
            <li key={l.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-medium text-foreground">{l.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  {l.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label={`Abrir dirección en el mapa: ${l.address}`}
                    >
                      <MapPin className="size-4" />
                    </a>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setLocModal({ id: l.id, name: l.name, address: l.address ?? "", notes: l.notes ?? "" })}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                      aria-label={`Editar ${l.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeLocation(l.id)}
                      className="flex size-9 items-center justify-center rounded-lg text-destructive hover:bg-muted"
                      aria-label={`Eliminar ${l.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              {l.address && <p className="mt-1 truncate text-xs text-muted-foreground">{l.address}</p>}
              {l.notes && <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p>}

              {l.contacts.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {l.contacts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground"> · {KIND_LABELS[c.kind] ?? c.kind}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <a
                          href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                          className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                          aria-label={`Llamar a ${c.name}`}
                        >
                          <Phone className="size-4" />
                        </a>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => removeContact(l.id, c.id)}
                            className="flex size-9 items-center justify-center rounded-lg text-destructive hover:bg-muted"
                            aria-label={`Eliminar contacto ${c.name}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setContactModal({ locationId: l.id, name: "", phone: "", kind: "emergency" })}
                  className="mt-2 flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-primary"
                >
                  <UserPlus className="size-4" /> Añadir contacto
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <button
          type="button"
          onClick={() => setLocModal({ name: "", address: "", notes: "" })}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary"
        >
          <Plus className="size-4" /> Añadir lugar
        </button>
      )}

      {/* Location modal */}
      <Modal open={Boolean(locModal)} onClose={() => setLocModal(null)} title={locModal?.id ? "Editar lugar" : "Añadir lugar"}>
        <form onSubmit={saveLocation} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
            <input name="name" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={locModal?.name ?? ""} onChange={setField(setLocModal)} placeholder="Casa, Residencia…" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dirección</label>
            <input name="address" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={locModal?.address ?? ""} onChange={setField(setLocModal)} placeholder="Calle, número, ciudad" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas</label>
            <textarea name="notes" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" value={locModal?.notes ?? ""} onChange={setField(setLocModal)} placeholder="Código de puerta, planta…" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving}>Guardar</button>
            <button type="button" className="flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setLocModal(null)}>Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Contact modal */}
      <Modal open={Boolean(contactModal)} onClose={() => setContactModal(null)} title={contactModal?.id ? "Editar contacto" : "Añadir contacto"}>
        <form onSubmit={saveContact} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
            <input name="name" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={contactModal?.name ?? ""} onChange={setField(setContactModal)} placeholder="Contacto en este lugar" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Teléfono</label>
            <input name="phone" type="tel" inputMode="tel" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={contactModal?.phone ?? ""} onChange={setField(setContactModal)} placeholder="612 345 678" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
            <select name="kind" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring" value={contactModal?.kind ?? "emergency"} onChange={setField(setContactModal)}>
              {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={saving}>Guardar</button>
            <button type="button" className="flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" onClick={() => setContactModal(null)}>Cancelar</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}