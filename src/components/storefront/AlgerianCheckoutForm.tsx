<motion.form
  onSubmit={handleSubmit}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35 }}
  className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl"
  style={{
    background: `linear-gradient(135deg, ${t.surface}, ${t.bg})`,
    border: `1px solid ${t.border}`,
    borderRadius: radius,
    color: t.fg,
  }}
>
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl"
      style={{
        backgroundColor: `${t.primary}33`,
      }}
    />

    <div
      className="absolute bottom-0 left-0 h-40 w-40 rounded-full blur-2xl"
      style={{
        backgroundColor: `${t.primary}22`,
      }}
    />
  </div>

  <div className="relative z-10">
    <h2
      className="text-2xl font-bold tracking-tight"
      style={{ color: t.fg }}
    >
      {tr("storefront.cod.title")}
    </h2>

    <p
      className="mt-2 text-sm"
      style={{ color: t.muted }}
    >
      {tr("storefront.cod.subtitle")}
    </p>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
    <Field
      icon={
        <User
          className="h-4 w-4"
          style={{ color: t.primary }}
        />
      }
      label={tr("storefront.cod.firstName")}
      error={errors.firstName}
      mutedColor={t.muted}
    >
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Ahmed"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: t.bg,
          color: t.fg,
          border: `1px solid ${t.border}`,
        }}
      />
    </Field>

    <Field
      icon={
        <User
          className="h-4 w-4"
          style={{ color: t.primary }}
        />
      }
      label={tr("storefront.cod.lastName")}
      error={errors.lastName}
      mutedColor={t.muted}
    >
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Benali"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: t.bg,
          color: t.fg,
          border: `1px solid ${t.border}`,
        }}
      />
    </Field>
  </div>

  <div className="relative z-10">
    <Field
      icon={
        <Phone
          className="h-4 w-4"
          style={{ color: t.primary }}
        />
      }
      label={tr("storefront.cod.phone")}
      error={errors.phone}
      mutedColor={t.muted}
    >
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="0555 12 34 56"
        inputMode="tel"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          backgroundColor: t.bg,
          color: t.fg,
          border: `1px solid ${t.border}`,
        }}
      />
    </Field>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
    <Field
      icon={
        <MapPin
          className="h-4 w-4"
          style={{ color: t.primary }}
        />
      }
      label={tr("storefront.cod.wilaya")}
      error={errors.wilaya}
      mutedColor={t.muted}
    >
      <SearchableSelect
        value={wilaya}
        onChange={(v) => {
          setWilaya(v);
          setCity("");
        }}
        options={WILAYA_LIST}
        placeholder={tr("storefront.cod.selectWilaya")}
        searchPlaceholder={tr("storefront.cod.searchWilaya")}
        emptyMessage={tr("storefront.cod.noWilaya")}
        triggerStyle={{
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          color: t.fg,
        }}
      />
    </Field>

    <Field
      icon={
        <MapPin
          className="h-4 w-4"
          style={{ color: t.primary }}
        />
      }
      label={tr("storefront.cod.city")}
      error={errors.city}
      mutedColor={t.muted}
    >
      <SearchableSelect
        value={city}
        onChange={setCity}
        options={cities}
        placeholder={
          wilaya
            ? tr("storefront.cod.selectCity")
            : tr("storefront.cod.pickWilayaFirst")
        }
        searchPlaceholder={tr("storefront.cod.searchCity")}
        emptyMessage={tr("storefront.cod.noCity")}
        disabled={!wilaya}
        triggerStyle={{
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          color: t.fg,
        }}
      />
    </Field>
  </div>

  <div className="relative z-10">
    <Field
      label={tr("storefront.cod.deliveryType")}
      mutedColor={t.muted}
    >
      <div className="grid grid-cols-2 gap-3">
        {(["domicile", "stopdesk"] as const).map((opt) => {
          const active = deliveryType === opt;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => setDeliveryType(opt)}
              className="rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${t.primary}, ${t.primary}dd)`
                  : t.bg,
                color: active ? t.onPrimary : t.fg,
                border: `1px solid ${active ? t.primary : t.border}`,
                boxShadow: active
                  ? `0 10px 30px -10px ${t.primary}88`
                  : "none",
              }}
            >
              <div className="flex flex-col items-center gap-2">
                {opt === "domicile" ? (
                  <Home className="h-5 w-5" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}

                <span className="text-sm font-medium">
                  {opt === "domicile"
                    ? tr("storefront.cod.deliveryHome")
                    : tr("storefront.cod.deliveryStopdesk")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Field>
  </div>

  <div
    className="relative z-10 rounded-2xl p-5 backdrop-blur-sm"
    style={{
      backgroundColor: `${t.bg}cc`,
      border: `1px solid ${t.border}`,
    }}
  >
    <div
      className="flex items-center justify-between text-sm"
      style={{ color: t.muted }}
    >
      <span>{tr("storefront.cod.subtotal")}</span>

      <span style={{ color: t.fg }}>
        {subtotal.toFixed(2)} DA
      </span>
    </div>

    <div
      className="mt-3 flex items-center justify-between text-sm"
      style={{ color: t.muted }}
    >
      <span>{tr("storefront.cod.shipping")}</span>

      <span style={{ color: t.fg }}>
        {!wilaya
          ? "—"
          : shippingLoading
          ? "…"
          : shippingPrice === null
          ? tr("storefront.cod.shippingUnavailable")
          : `${shippingPrice.toFixed(2)} DA`}
      </span>
    </div>

    <div
      className="mt-4 flex items-center justify-between pt-4"
      style={{
        borderTop: `1px solid ${t.border}`,
      }}
    >
      <div
        className="text-sm"
        style={{ color: t.muted }}
      >
        {tr("storefront.cod.totalLine", { count: quantity })}
      </div>

      <div
        className="text-2xl font-bold"
        style={{ color: t.fg }}
      >
        {total.toFixed(2)} DA
      </div>
    </div>
  </div>

  <button
    type="submit"
    disabled={submitting}
    className="relative z-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.01] disabled:opacity-50"
    style={{
      background: `linear-gradient(135deg, ${t.primary}, ${t.primary}dd)`,
      color: t.onPrimary,
      boxShadow: `0 10px 30px -10px ${t.primary}88`,
    }}
  >
    {submitting ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : (
      <ShoppingBag className="h-5 w-5" />
    )}

    {submitting
      ? tr("storefront.cod.placing")
      : tr("storefront.cod.orderNow")}
  </button>
</motion.form>
