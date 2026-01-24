import React from "react"

type Props = {
  observation: string
  addDescription: string
  transCost: number
  retiraSucursal: "S" | "N"

  addressInputsDisabled: boolean
  transportDisabled: boolean
  pickupDisabled: boolean

  onChangeObservation: (v: string) => void
  onChangeAddDescription: (v: string) => void
  onChangeTransCost: (v: number) => void
  onTogglePickup: (next: "S" | "N") => void
}

export function CartInputsSection({
  observation,
  addDescription,
  transCost,
  retiraSucursal,
  addressInputsDisabled,
  transportDisabled,
  pickupDisabled,
  onChangeObservation,
  onChangeAddDescription,
  onChangeTransCost,
  onTogglePickup,
}: Props) {
  return (
    <div className="productTab-content__inputContaner">
      <div className="productTab-content__inputs">
        <textarea
          rows={5}
          name="observation"
          id="observation"
          className="productTab-content__input"
          placeholder="observación"
          value={observation}
          onChange={(e) => onChangeObservation(e.target.value)}
        />

        <textarea
          rows={5}
          name="descripcion"
          id="descripcion"
          className="productTab-content__input"
          placeholder="dirección"
          value={addDescription}
          disabled={addressInputsDisabled}
          onChange={(e) => {
            if (addressInputsDisabled) return
            onChangeAddDescription(e.target.value)
          }}
        />

        <div className="transportationCost__input">
          <input
            type="number"
            min={0}
            name="shipment"
            id="shipment"
            placeholder="C$ transporte "
            value={transCost}
            disabled={transportDisabled}
            onChange={(e) => {
              if (transportDisabled) return
              onChangeTransCost(e.target.value === "" ? 0 : Number(e.target.value))
            }}
            className="productTab-content__input transportationCost"
          />
        </div>

        <div className="transportationCost__checkbox">
          <input
            type="checkbox"
            id="retiraSucursal"
            checked={retiraSucursal === "S"}
            disabled={pickupDisabled}
            onChange={(e) => onTogglePickup(e.target.checked ? "S" : "N")}
          />
          <label htmlFor="retiraSucursal">Retira en sucursal</label>
        </div>
      </div>
    </div>
  )
}
