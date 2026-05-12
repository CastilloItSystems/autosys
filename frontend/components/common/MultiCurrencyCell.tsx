import {
  breakdownEntries,
  formatCurrency,
  formatBreakdownLine,
  type CurrencyAmount,
} from "@/utils/currencyFormat";

interface Props {
  /** Breakdown por moneda */
  amount: CurrencyAmount | undefined | null;
  /** Equivalente en USD (suma de las monedas convertidas) */
  amountUSD?: number;
  /** Si solo hay 1 moneda, mostrarla destacada (sino prevalece USD) */
  highlight?: "usd" | "primary";
  /** Texto cuando no hay datos */
  empty?: string;
}

/**
 * Celda de tabla para mostrar montos multi-moneda.
 * - 1 moneda y es USD: solo USD destacado.
 * - 1 moneda no-USD: monto en moneda + equivalente USD.
 * - varias monedas: USD destacado + breakdown abajo (tooltip con detalle).
 */
const MultiCurrencyCell = ({
  amount,
  amountUSD,
  highlight = "primary",
  empty = "—",
}: Props) => {
  const entries = breakdownEntries(amount);
  if (entries.length === 0 && (amountUSD ?? 0) === 0) {
    return <span className="text-500">{empty}</span>;
  }

  const onlyOne = entries.length === 1;
  const onlyUSD = onlyOne && entries[0][0] === "USD";

  if (onlyUSD) {
    return (
      <span
        className={
          highlight === "primary" ? "font-bold text-primary" : "font-semibold"
        }
      >
        {formatCurrency(entries[0][1], "USD")}
      </span>
    );
  }

  return (
    <div
      className="flex flex-column"
      title={formatBreakdownLine(amount)}
    >
      <span
        className={
          highlight === "primary"
            ? "font-bold text-primary white-space-nowrap"
            : "font-semibold white-space-nowrap"
        }
      >
        {formatCurrency(amountUSD ?? 0, "USD")}
      </span>
      {!onlyOne || !onlyUSD ? (
        <span className="text-500 text-xs white-space-nowrap">
          {entries
            .map(([c, v]) => `${c} ${formatCurrency(v, c).replace(/^[^\d-]+/, "")}`)
            .join(" · ")}
        </span>
      ) : null}
    </div>
  );
};

export default MultiCurrencyCell;
