"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataView } from "primereact/dataview";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Image } from "primereact/image";
import { Toast } from "primereact/toast";
import { Slider } from "primereact/slider";
import { Checkbox } from "primereact/checkbox";
import { Chip } from "primereact/chip";
import { Carousel } from "primereact/carousel";
import { TabView, TabPanel } from "primereact/tabview";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion, AnimatePresence } from "framer-motion";
import { useVentasStore } from "@/store/ventasStore";

interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  kilometraje: number;
  color: string;
  combustible: string;
  transmision: string;
  imagenes: string[];
  descripcion: string;
  caracteristicas: string[];
  estado: string;
  ubicacion: string;
}

const ConcesionarioPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Vehicle[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Estado para calculadora de financiamiento
  const [financingData, setFinancingData] = useState({
    precio: 0,
    enganche: 0,
    plazo: 36,
    tasaInteres: 12.5,
  });

  // Store de ventas
  const { agregarCotizacion } = useVentasStore();

  // Estado para diálogo de cotización
  const [cotizacionDialog, setCotizacionDialog] = useState(false);
  const [clienteData, setClienteData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    documento: "",
  });

  // Filtros avanzados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedTransmisiones, setSelectedTransmisiones] = useState<string[]>(
    []
  );
  const [selectedCombustibles, setSelectedCombustibles] = useState<string[]>(
    []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [showOnlyZeroKm, setShowOnlyZeroKm] = useState(false);
  const [sortBy, setSortBy] = useState<string>("precio-asc");

  const toast = useRef<Toast>(null);

  // Cargar datos de vehículos
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const response = await fetch("/demo/vehicles.json");
        const data = await response.json();
        setVehicles(data);
        setFilteredVehicles(data);
        // Calcular precio máximo
        const maxPriceFromData = Math.max(
          ...data.map((v: Vehicle) => v.precio)
        );
        setMaxPrice(maxPriceFromData);
        setPriceRange([0, maxPriceFromData]);
      } catch (error) {
        console.error("Error loading vehicles:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los vehículos",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // Filtrar y ordenar vehículos
  useEffect(() => {
    let filtered = vehicles;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros múltiples
    if (selectedMarcas.length > 0) {
      filtered = filtered.filter((vehicle) =>
        selectedMarcas.includes(vehicle.marca)
      );
    }

    if (selectedTransmisiones.length > 0) {
      filtered = filtered.filter((vehicle) =>
        selectedTransmisiones.includes(vehicle.transmision)
      );
    }

    if (selectedCombustibles.length > 0) {
      filtered = filtered.filter((vehicle) =>
        selectedCombustibles.includes(vehicle.combustible)
      );
    }

    // Filtro de precio
    filtered = filtered.filter(
      (vehicle) =>
        vehicle.precio >= priceRange[0] && vehicle.precio <= priceRange[1]
    );

    // Filtro de cero km
    if (showOnlyZeroKm) {
      filtered = filtered.filter((vehicle) => vehicle.kilometraje === 0);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "precio-asc":
          return a.precio - b.precio;
        case "precio-desc":
          return b.precio - a.precio;
        case "anio-desc":
          return b.anio - a.anio;
        case "anio-asc":
          return a.anio - b.anio;
        case "kilometraje-asc":
          return a.kilometraje - b.kilometraje;
        default:
          return 0;
      }
    });

    setFilteredVehicles(filtered);
  }, [
    vehicles,
    searchTerm,
    selectedMarcas,
    selectedTransmisiones,
    selectedCombustibles,
    priceRange,
    showOnlyZeroKm,
    sortBy,
  ]);

  // Opciones para filtros
  const marcaOptions = Array.from(new Set(vehicles.map((v) => v.marca))).map(
    (marca) => ({
      label: marca,
      value: marca,
    })
  );

  const transmisionOptions = Array.from(
    new Set(vehicles.map((v) => v.transmision))
  ).map((trans) => ({
    label: trans,
    value: trans,
  }));

  const combustibleOptions = Array.from(
    new Set(vehicles.map((v) => v.combustible))
  ).map((comb) => ({
    label: comb,
    value: comb,
  }));

  const sortOptions = [
    { label: "Precio: Menor a Mayor", value: "precio-asc" },
    { label: "Precio: Mayor a Menor", value: "precio-desc" },
    { label: "Año: Más Nuevo", value: "anio-desc" },
    { label: "Año: Más Antiguo", value: "anio-asc" },
    { label: "Kilometraje: Menor", value: "kilometraje-asc" },
  ];

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Función para calcular financiamiento
  const calcularFinanciamiento = (
    precio: number,
    enganche: number,
    plazo: number,
    tasa: number
  ) => {
    const montoFinanciar = precio - enganche;
    const tasaMensual = tasa / 100 / 12;
    const numeroPagos = plazo;

    const pagoMensual =
      (montoFinanciar *
        (tasaMensual * Math.pow(1 + tasaMensual, numeroPagos))) /
      (Math.pow(1 + tasaMensual, numeroPagos) - 1);
    const totalPagar = pagoMensual * numeroPagos;
    const totalIntereses = totalPagar - montoFinanciar;

    return {
      pagoMensual: Math.round(pagoMensual),
      totalPagar: Math.round(totalPagar),
      totalIntereses: Math.round(totalIntereses),
      montoFinanciar: Math.round(montoFinanciar),
    };
  };

  // Función para enviar cotización
  const enviarCotizacion = () => {
    if (!selectedVehicle) return;

    // Determinar prioridad basada en el precio y estado del vehículo
    let prioridad: "baja" | "media" | "alta" | "urgente" = "media";
    if (selectedVehicle.precio > 400000) {
      prioridad = "alta";
    }
    if (selectedVehicle.estado === "Bajo Pedido") {
      prioridad = "urgente";
    }

    // Generar notas automáticas
    let notas = `Cotización solicitada para ${selectedVehicle.marca} ${selectedVehicle.modelo} ${selectedVehicle.anio}. `;
    if (financingData.precio > 0) {
      notas += `Interesado en financiamiento: enganche ${formatPrice(
        financingData.enganche
      )}, ${financingData.plazo} meses a ${financingData.tasaInteres}% anual.`;
    } else {
      notas += "Pago de contado solicitado.";
    }

    if (selectedVehicle.estado === "Bajo Pedido") {
      notas += " Vehículo bajo pedido - requiere configuración especial.";
    } else if (selectedVehicle.estado === "Próxima Llegada") {
      notas += " Vehículo próxima llegada - verificar fecha exacta.";
    }

    agregarCotizacion({
      cliente: clienteData,
      vehiculo: {
        id: selectedVehicle.id,
        marca: selectedVehicle.marca,
        modelo: selectedVehicle.modelo,
        anio: selectedVehicle.anio,
        precio: selectedVehicle.precio,
        imagen:
          selectedVehicle.imagenes[0] || "/demo/images/placeholder-car.svg",
      },
      financiamiento:
        financingData.precio > 0
          ? {
              enganche: financingData.enganche,
              plazo: financingData.plazo,
              tasaInteres: financingData.tasaInteres,
              pagoMensual: calcularFinanciamiento(
                financingData.precio,
                financingData.enganche,
                financingData.plazo,
                financingData.tasaInteres
              ).pagoMensual,
            }
          : undefined,
      prioridad,
      notas,
      fechaSeguimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Seguimiento en 2 días
    });

    // Resetear formulario
    setClienteData({
      nombre: "",
      email: "",
      telefono: "",
      documento: "",
    });

    setCotizacionDialog(false);
    setDetailDialog(false);

    toast.current?.show({
      severity: "success",
      summary: "¡Cotización Enviada! 🎉",
      detail: `Tu cotización para ${selectedVehicle.marca} ${selectedVehicle.modelo} ha sido registrada. Un asesor te contactará pronto.`,
      life: 6000,
    });
  };

  // Template para cada vehículo en la vista de lista
  const vehicleTemplate = (vehicle: Vehicle) => {
    const isFavorite = favorites.has(vehicle.id);
    const isInCompare = compareList.some((v) => v.id === vehicle.id);

    return (
      <motion.div
        key={vehicle.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`col-12 ${
          viewMode === "grid" ? "md:col-6 lg:col-4 xl:col-3" : ""
        } mb-4`}
      >
        <Card className="h-full shadow-2 hover:shadow-6 transition-all duration-300 border-round-xl overflow-hidden bg-white hover:transform hover:scale-105 relative group">
          {/* Overlay de acciones rápidas */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-1">
              <Button
                icon={isFavorite ? "pi pi-heart-fill" : "pi pi-heart"}
                className={`p-button-rounded p-button-sm ${
                  isFavorite ? "p-button-danger" : "p-button-outlined"
                }`}
                tooltip={
                  isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  const newFavorites = new Set(favorites);
                  if (isFavorite) {
                    newFavorites.delete(vehicle.id);
                  } else {
                    newFavorites.add(vehicle.id);
                  }
                  setFavorites(newFavorites);
                  toast.current?.show({
                    severity: isFavorite ? "info" : "success",
                    summary: isFavorite
                      ? "Eliminado de favoritos"
                      : "Agregado a favoritos",
                    detail: `${vehicle.marca} ${vehicle.modelo}`,
                    life: 2000,
                  });
                }}
              />
              <Button
                icon="pi pi-balance-scale"
                className={`p-button-rounded p-button-sm ${
                  isInCompare ? "p-button-success" : "p-button-outlined"
                }`}
                tooltip={
                  isInCompare
                    ? "Quitar de comparación"
                    : "Agregar a comparación"
                }
                onClick={(e) => {
                  if (isInCompare) {
                    setCompareList(
                      compareList.filter((v) => v.id !== vehicle.id)
                    );
                    toast.current?.show({
                      severity: "info",
                      summary: "Eliminado de comparación",
                      detail: `${vehicle.marca} ${vehicle.modelo}`,
                      life: 2000,
                    });
                  } else if (compareList.length < 4) {
                    setCompareList([...compareList, vehicle]);
                    toast.current?.show({
                      severity: "success",
                      summary: "Agregado a comparación",
                      detail: `${vehicle.marca} ${vehicle.modelo}`,
                      life: 2000,
                    });
                  } else {
                    toast.current?.show({
                      severity: "warn",
                      summary: "Límite alcanzado",
                      detail: "Máximo 4 vehículos para comparar",
                      life: 3000,
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="relative">
            <Image
              src={vehicle.imagenes[0] || "/demo/images/placeholder-car.svg"}
              alt={`${vehicle.marca} ${vehicle.modelo}`}
              width="100%"
              height={viewMode === "grid" ? "200" : "150"}
              className="w-full border-round-top object-cover"
              preview
            />
            <div className="absolute top-0 left-0 m-2">
              <Badge
                value={vehicle.estado}
                severity={
                  vehicle.estado === "Disponible"
                    ? "success"
                    : vehicle.estado === "Próxima Llegada"
                    ? "info"
                    : vehicle.estado === "Bajo Pedido"
                    ? "warning"
                    : "secondary"
                }
                className="text-xs font-bold px-2 py-1"
              />
            </div>
            {vehicle.kilometraje === 0 && (
              <div className="absolute top-0 right-0 m-2">
                <Badge
                  value="0 KM"
                  severity="info"
                  className="text-xs font-bold px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                />
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex justify-content-between align-items-start mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold m-0 text-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {vehicle.marca} {vehicle.modelo}
                </h3>
                <div className="flex align-items-center gap-2 mb-2">
                  <Tag
                    value={`${vehicle.anio}`}
                    severity="secondary"
                    className="text-xs"
                  />
                  <Tag
                    value={vehicle.color}
                    severity="info"
                    className="text-xs"
                  />
                </div>
                <p className="text-600 text-sm m-0 line-clamp-2">
                  {vehicle.descripcion.substring(0, 80)}...
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-2xl font-bold text-primary m-0 mb-1">
                  {formatPrice(vehicle.precio)}
                </p>
                <p className="text-xs text-500 m-0">
                  {vehicle.kilometraje.toLocaleString()} km
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              <Tag
                value={vehicle.transmision}
                severity="success"
                className="text-xs px-2 py-1"
              />
              <Tag
                value={vehicle.combustible}
                severity="warning"
                className="text-xs px-2 py-1"
              />
              <Tag
                value={vehicle.ubicacion}
                severity="info"
                className="text-xs px-2 py-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                label="Ver Detalles"
                icon="pi pi-eye"
                className="p-button-sm p-button-outlined flex-1 border-round-lg hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setFinancingData({
                    precio: vehicle.precio,
                    enganche: vehicle.precio * 0.2, // Enganche mínimo del 20%
                    plazo: 36,
                    tasaInteres: 12.5,
                  });
                  setDetailDialog(true);
                }}
              />
              <Button
                label="Cotizar"
                icon="pi pi-calculator"
                className="p-button-sm p-button-gradient flex-1 border-round-lg"
                onClick={() => {
                  toast.current?.show({
                    severity: "success",
                    summary: "¡Cotización Solicitada! 🎉",
                    detail: `Te contactaremos pronto sobre ${vehicle.marca} ${vehicle.modelo}`,
                    life: 4000,
                  });
                }}
              />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Template para vista de lista (sin grid)
  const listTemplate = (items: Vehicle[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="col-12 text-center py-8">
          <i className="pi pi-car text-6xl text-400 mb-4"></i>
          <h3 className="text-600 mb-2">No se encontraron vehículos</h3>
          <p className="text-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      );
    }

    return <div className="grid">{items.map(vehicleTemplate)}</div>;
  };

  if (loading) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
          <p className="text-600">Cargando catálogo de vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="concesionario-page bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Toast ref={toast} />

      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg border-round-xl p-4 mb-4 mx-2"
      >
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent m-0">
              🚗 Concesionario Premium
            </h1>
            <p className="text-600 mt-2 text-lg">
              Descubre tu próximo vehículo con la mejor experiencia digital
            </p>
          </div>
          <div className="flex flex-column sm:flex-row gap-3 align-items-center">
            <div className="flex gap-2">
              <Badge
                value={`${filteredVehicles.length} vehículos`}
                severity="info"
                className="text-sm px-3 py-2"
              />
              {favorites.size > 0 && (
                <Badge
                  value={`${favorites.size} favoritos`}
                  severity="warning"
                  className="text-sm px-3 py-2"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                icon={viewMode === "grid" ? "pi pi-list" : "pi pi-th-large"}
                className="p-button-rounded p-button-outlined"
                tooltip={
                  viewMode === "grid" ? "Vista Lista" : "Vista Cuadrícula"
                }
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              />
              {compareList.length > 0 && (
                <Button
                  label={`Comparar (${compareList.length})`}
                  icon="pi pi-balance-scale"
                  className="p-button-success"
                  onClick={() => setShowCompare(true)}
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros Avanzados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="mb-4 shadow-2 border-round-xl bg-white/80 backdrop-blur-sm">
          <TabView className="border-none">
            <TabPanel header="Filtros Rápidos" leftIcon="pi pi-filter">
              <div className="grid">
                <div className="col-12 md:col-4">
                  <label className="block text-900 font-semibold mb-2 text-lg">
                    🔍 Búsqueda Inteligente
                  </label>
                  <span className="p-input-icon-left w-full">
                    <i className="pi pi-search text-gray-400"></i>
                    <InputText
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Busca por marca, modelo o características..."
                      className="w-full p-3 text-lg border-round-lg pl-5"
                    />
                  </span>
                </div>
                <div className="col-12 md:col-4">
                  <label className="block text-900 font-semibold mb-2 text-lg">
                    📊 Ordenar Por
                  </label>
                  <Dropdown
                    value={sortBy}
                    options={sortOptions}
                    onChange={(e) => setSortBy(e.value)}
                    placeholder="Ordenar vehículos"
                    className="w-full border-round-lg"
                  />
                </div>
                <div className="col-12 md:col-4 flex align-items-end">
                  <div className="flex gap-2 w-full">
                    <Button
                      label="Limpiar Todo"
                      icon="pi pi-refresh"
                      className="p-button-sm p-button-outlined p-button-danger flex-1"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedMarcas([]);
                        setSelectedTransmisiones([]);
                        setSelectedCombustibles([]);
                        setPriceRange([0, maxPrice]);
                        setShowOnlyZeroKm(false);
                        setSortBy("precio-asc");
                      }}
                    />
                    <Button
                      label="Aplicar"
                      icon="pi pi-check"
                      className="p-button-sm p-button-success flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Filtros Avanzados" leftIcon="pi pi-sliders-h">
              <div className="grid">
                <div className="col-12 md:col-6 lg:col-3">
                  <label className="block text-900 font-semibold mb-2">
                    🏷️ Marcas
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-12rem overflow-y-auto">
                    {marcaOptions.map((marca) => (
                      <Chip
                        key={marca.value}
                        label={marca.label}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedMarcas.includes(marca.value)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                        }`}
                        onClick={() => {
                          if (selectedMarcas.includes(marca.value)) {
                            setSelectedMarcas(
                              selectedMarcas.filter((m) => m !== marca.value)
                            );
                          } else {
                            setSelectedMarcas([...selectedMarcas, marca.value]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-12 md:col-6 lg:col-3">
                  <label className="block text-900 font-semibold mb-2">
                    ⚙️ Transmisión
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {transmisionOptions.map((trans) => (
                      <Chip
                        key={trans.value}
                        label={trans.label}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedTransmisiones.includes(trans.value)
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-green-100"
                        }`}
                        onClick={() => {
                          if (selectedTransmisiones.includes(trans.value)) {
                            setSelectedTransmisiones(
                              selectedTransmisiones.filter(
                                (t) => t !== trans.value
                              )
                            );
                          } else {
                            setSelectedTransmisiones([
                              ...selectedTransmisiones,
                              trans.value,
                            ]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-12 md:col-6 lg:col-3">
                  <label className="block text-900 font-semibold mb-2">
                    ⛽ Combustible
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {combustibleOptions.map((comb) => (
                      <Chip
                        key={comb.value}
                        label={comb.label}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedCombustibles.includes(comb.value)
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                        }`}
                        onClick={() => {
                          if (selectedCombustibles.includes(comb.value)) {
                            setSelectedCombustibles(
                              selectedCombustibles.filter(
                                (c) => c !== comb.value
                              )
                            );
                          } else {
                            setSelectedCombustibles([
                              ...selectedCombustibles,
                              comb.value,
                            ]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-12 md:col-6 lg:col-3">
                  <label className="block text-900 font-semibold mb-2">
                    💰 Rango de Precio
                  </label>
                  <div className="p-3 bg-gray-50 border-round-lg">
                    <Slider
                      value={priceRange}
                      onChange={(e) =>
                        setPriceRange(e.value as [number, number])
                      }
                      range
                      min={0}
                      max={maxPrice}
                      step={10000}
                      className="mb-2"
                    />
                    <div className="flex justify-content-between text-sm text-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex align-items-center gap-2">
                      <Checkbox
                        inputId="zeroKm"
                        checked={showOnlyZeroKm}
                        onChange={(e) => setShowOnlyZeroKm(e.checked || false)}
                      />
                      <label htmlFor="zeroKm" className="text-sm font-medium">
                        🚀 Solo vehículos 0 km
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </Card>
      </motion.div>

      {/* Catálogo de vehículos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <DataView
          value={filteredVehicles}
          layout={viewMode}
          itemTemplate={vehicleTemplate}
          listTemplate={listTemplate}
          paginator
          rows={viewMode === "grid" ? 12 : 8}
          emptyMessage="No se encontraron vehículos con los criterios seleccionados"
          className="shadow-1 border-round-xl bg-white/80 backdrop-blur-sm"
        />
      </motion.div>

      {/* Diálogo de detalles del vehículo */}
      <Dialog
        visible={detailDialog}
        onHide={() => setDetailDialog(false)}
        header={
          <div className="flex align-items-center justify-content-between w-full">
            <div>
              <h2 className="text-2xl font-bold m-0 text-900">
                {selectedVehicle?.marca} {selectedVehicle?.modelo}
              </h2>
              <p className="text-lg text-600 m-0 mt-1">
                {selectedVehicle?.anio} •{" "}
                {selectedVehicle?.kilometraje.toLocaleString()} km
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1">
                {selectedVehicle && formatPrice(selectedVehicle.precio)}
              </div>
              <Badge
                value={selectedVehicle?.estado}
                severity={
                  selectedVehicle?.estado === "Disponible"
                    ? "success"
                    : "warning"
                }
                className="text-sm px-3 py-1"
              />
            </div>
          </div>
        }
        style={{ width: "95vw", maxWidth: "1000px" }}
        maximizable
        className="vehicle-detail-dialog border-round-xl"
        footer={
          selectedVehicle && (
            <div className="flex gap-3 justify-content-end border-top-1 border-200 pt-3">
              <Button
                label="Agregar a Comparación"
                icon="pi pi-balance-scale"
                className="p-button-outlined"
                onClick={() => {
                  if (
                    compareList.length < 4 &&
                    !compareList.some((v) => v.id === selectedVehicle.id)
                  ) {
                    setCompareList([...compareList, selectedVehicle]);
                    toast.current?.show({
                      severity: "success",
                      summary: "Agregado a comparación",
                      detail: `${selectedVehicle.marca} ${selectedVehicle.modelo}`,
                      life: 3000,
                    });
                  } else if (
                    compareList.some((v) => v.id === selectedVehicle.id)
                  ) {
                    toast.current?.show({
                      severity: "info",
                      summary: "Ya está en comparación",
                      detail:
                        "Este vehículo ya está en tu lista de comparación",
                      life: 3000,
                    });
                  } else {
                    toast.current?.show({
                      severity: "warn",
                      summary: "Límite alcanzado",
                      detail: "Máximo 4 vehículos para comparar",
                      life: 3000,
                    });
                  }
                }}
              />
              <Button
                label="Agendar Prueba de Manejo"
                icon="pi pi-calendar"
                className="p-button-secondary"
                onClick={() => {
                  toast.current?.show({
                    severity: "info",
                    summary: "¡Prueba de Manejo Agendada! 📅",
                    detail:
                      "Un asesor se pondrá en contacto para coordinar la cita",
                    life: 5000,
                  });
                }}
              />
              <Button
                label="Solicitar Financiamiento"
                icon="pi pi-credit-card"
                className="p-button-info"
                onClick={() => {
                  toast.current?.show({
                    severity: "success",
                    summary: "¡Financiamiento Solicitado! 💰",
                    detail:
                      "Te contactaremos con las mejores opciones de financiamiento",
                    life: 5000,
                  });
                }}
              />
              <Button
                label="Cotizar Ahora"
                icon="pi pi-calculator"
                className="p-button-success p-button-lg"
                onClick={() => {
                  setCotizacionDialog(true);
                }}
              />
            </div>
          )
        }
      >
        {selectedVehicle && (
          <div className="vehicle-detail-content">
            <TabView className="border-none">
              <TabPanel header="Vista General" leftIcon="pi pi-eye">
                <div className="grid">
                  <div className="col-12 lg:col-7">
                    {/* Carousel de imágenes */}
                    <div className="image-gallery mb-4">
                      <Image
                        src={
                          selectedVehicle.imagenes[0] ||
                          "/demo/images/placeholder-car.svg"
                        }
                        alt={`${selectedVehicle.marca} ${selectedVehicle.modelo}`}
                        width="100%"
                        height="300"
                        className="border-round-lg shadow-4 w-full"
                        style={{ objectFit: "cover" }}
                        preview
                      />
                      {selectedVehicle.imagenes.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {selectedVehicle.imagenes.map((img, index) => (
                            <Image
                              key={index}
                              src={img}
                              alt={`Vista ${index + 1}`}
                              width="80"
                              height="60"
                              className="border-round cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                              style={{ objectFit: "cover", minWidth: "80px" }}
                              preview
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Características principales */}
                    <div className="grid">
                      <div className="col-6">
                        <div className="bg-blue-50 border-round-lg p-3 text-center">
                          <i className="pi pi-cog text-3xl text-blue-500 mb-2"></i>
                          <div className="font-bold text-blue-700">
                            Transmisión
                          </div>
                          <div className="text-blue-600">
                            {selectedVehicle.transmision}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-green-50 border-round-lg p-3 text-center">
                          <i className="pi pi-bolt text-3xl text-green-500 mb-2"></i>
                          <div className="font-bold text-green-700">
                            Combustible
                          </div>
                          <div className="text-green-600">
                            {selectedVehicle.combustible}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-purple-50 border-round-lg p-3 text-center">
                          <i className="pi pi-palette text-3xl text-purple-500 mb-2"></i>
                          <div className="font-bold text-purple-700">Color</div>
                          <div className="text-purple-600">
                            {selectedVehicle.color}
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-orange-50 border-round-lg p-3 text-center">
                          <i className="pi pi-map-marker text-3xl text-orange-500 mb-2"></i>
                          <div className="font-bold text-orange-700">
                            Ubicación
                          </div>
                          <div className="text-orange-600">
                            {selectedVehicle.ubicacion}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 lg:col-5">
                    {/* Información detallada */}
                    <Card className="shadow-2 border-round-xl bg-gradient-to-br from-gray-50 to-blue-50">
                      <h3 className="text-xl font-bold mb-4 text-900">
                        📋 Especificaciones
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-content-between align-items-center py-2 border-bottom-1 border-200">
                          <span className="font-medium text-700">
                            Año Modelo:
                          </span>
                          <span className="font-bold text-900">
                            {selectedVehicle.anio}
                          </span>
                        </div>
                        <div className="flex justify-content-between align-items-center py-2 border-bottom-1 border-200">
                          <span className="font-medium text-700">
                            Kilometraje:
                          </span>
                          <span className="font-bold text-900">
                            {selectedVehicle.kilometraje.toLocaleString()} km
                          </span>
                        </div>
                        <div className="flex justify-content-between align-items-center py-2 border-bottom-1 border-200">
                          <span className="font-medium text-700">Estado:</span>
                          <Badge
                            value={selectedVehicle.estado}
                            severity={
                              selectedVehicle.estado === "Disponible"
                                ? "success"
                                : selectedVehicle.estado === "Próxima Llegada"
                                ? "info"
                                : selectedVehicle.estado === "Bajo Pedido"
                                ? "warning"
                                : "secondary"
                            }
                          />
                        </div>
                        <div className="flex justify-content-between align-items-center py-2">
                          <span className="font-medium text-700">
                            Ubicación:
                          </span>
                          <span className="font-bold text-900">
                            {selectedVehicle.ubicacion}
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Garantías y beneficios */}
                    <Card className="shadow-2 border-round-xl mt-3 bg-gradient-to-br from-green-50 to-emerald-50">
                      <h4 className="text-lg font-bold mb-3 text-900 flex align-items-center gap-2">
                        <i className="pi pi-shield text-green-600"></i>
                        Garantías y Beneficios
                      </h4>
                      <div className="space-y-2">
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-check-circle text-green-500"></i>
                          <span className="text-sm">
                            Garantía de{" "}
                            {selectedVehicle.kilometraje === 0
                              ? "fábrica"
                              : "revisión"}{" "}
                            incluida
                          </span>
                        </div>
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-check-circle text-green-500"></i>
                          <span className="text-sm">
                            Revisión mecánica completa
                          </span>
                        </div>
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-check-circle text-green-500"></i>
                          <span className="text-sm">
                            Asistencia en carretera 24/7
                          </span>
                        </div>
                        <div className="flex align-items-center gap-2">
                          <i className="pi pi-check-circle text-green-500"></i>
                          <span className="text-sm">
                            Financiamiento disponible desde 0%
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Características Técnicas" leftIcon="pi pi-list">
                <div className="grid">
                  <div className="col-12">
                    <h3 className="text-xl font-bold mb-4 text-900">
                      🔧 Características Técnicas
                    </h3>
                    <div className="grid">
                      {selectedVehicle.caracteristicas.map(
                        (caracteristica, index) => (
                          <div
                            key={index}
                            className="col-12 md:col-6 lg:col-4 mb-3"
                          >
                            <div className="flex align-items-center gap-3 p-3 bg-white border-round-lg shadow-1 hover:shadow-2 transition-shadow">
                              <div className="bg-blue-100 border-round border-circle w-3rem h-3rem flex align-items-center justify-content-center">
                                <i className="pi pi-check text-blue-600"></i>
                              </div>
                              <span className="font-medium text-700">
                                {caracteristica}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Descripción" leftIcon="pi pi-info-circle">
                <div className="bg-gray-50 border-round-lg p-4">
                  <h3 className="text-xl font-bold mb-3 text-900">
                    📝 Descripción del Vehículo
                  </h3>
                  <p className="text-700 line-height-3 text-lg leading-relaxed">
                    {selectedVehicle.descripcion}
                  </p>

                  {selectedVehicle.kilometraje === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border-round-lg border-left-4 border-blue-400">
                      <div className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-star-fill text-blue-600"></i>
                        <span className="font-bold text-blue-800">
                          Vehículo 0 Kilómetros
                        </span>
                      </div>
                      <p className="text-blue-700 m-0">
                        Este vehículo es completamente nuevo y cuenta con toda
                        la garantía de fábrica. Ideal para quienes buscan lo
                        último en tecnología automotriz.
                      </p>
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel
                header="💰 Calculadora de Financiamiento"
                leftIcon="pi pi-calculator"
              >
                <div className="grid">
                  <div className="col-12 lg:col-6">
                    <Card className="shadow-2 border-round-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                      <h3 className="text-xl font-bold mb-4 text-900 flex align-items-center gap-2">
                        <i className="pi pi-calculator text-blue-600"></i>
                        Simulador de Financiamiento
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Precio del Vehículo
                          </label>
                          <InputText
                            value={formatPrice(financingData.precio)}
                            readOnly
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Enganche (Mínimo 20%):{" "}
                            {Math.round(
                              (financingData.enganche / financingData.precio) *
                                100
                            ) || 0}
                            %
                          </label>
                          <Slider
                            value={financingData.enganche}
                            onChange={(e) =>
                              setFinancingData({
                                ...financingData,
                                enganche: e.value as number,
                              })
                            }
                            min={financingData.precio * 0.2}
                            max={financingData.precio * 0.5}
                            step={1000}
                            className="mb-2"
                          />
                          <InputText
                            value={formatPrice(financingData.enganche)}
                            onChange={(e) =>
                              setFinancingData({
                                ...financingData,
                                enganche:
                                  parseFloat(
                                    e.target.value.replace(/[^0-9]/g, "")
                                  ) || 0,
                              })
                            }
                            className="w-full"
                            placeholder="Monto del enganche"
                          />
                        </div>

                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Plazo (Meses)
                          </label>
                          <Dropdown
                            value={financingData.plazo}
                            options={[
                              { label: "12 meses", value: 12 },
                              { label: "24 meses", value: 24 },
                              { label: "36 meses", value: 36 },
                              { label: "48 meses", value: 48 },
                              { label: "60 meses", value: 60 },
                            ]}
                            onChange={(e) =>
                              setFinancingData({
                                ...financingData,
                                plazo: e.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-900 font-semibold mb-2">
                            Tasa de Interés Anual: {financingData.tasaInteres}%
                          </label>
                          <Slider
                            value={financingData.tasaInteres}
                            onChange={(e) =>
                              setFinancingData({
                                ...financingData,
                                tasaInteres: e.value as number,
                              })
                            }
                            min={8}
                            max={25}
                            step={0.5}
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="col-12 lg:col-6">
                    <Card className="shadow-2 border-round-xl bg-gradient-to-br from-green-50 to-emerald-50">
                      <h3 className="text-xl font-bold mb-4 text-900 flex align-items-center gap-2">
                        <i className="pi pi-chart-line text-green-600"></i>
                        Resultado del Financiamiento
                      </h3>

                      {financingData.precio > 0 && (
                        <div className="space-y-4">
                          {(() => {
                            const resultado = calcularFinanciamiento(
                              financingData.precio,
                              financingData.enganche,
                              financingData.plazo,
                              financingData.tasaInteres
                            );

                            return (
                              <>
                                <div className="bg-white border-round-lg p-4 shadow-1">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">
                                      {formatPrice(resultado.pagoMensual)}
                                    </div>
                                    <div className="text-sm text-600">
                                      Pago Mensual
                                    </div>
                                  </div>
                                </div>

                                <div className="grid">
                                  <div className="col-6">
                                    <div className="bg-white border-round-lg p-3 text-center shadow-1">
                                      <div className="text-lg font-bold text-blue-600">
                                        {formatPrice(resultado.montoFinanciar)}
                                      </div>
                                      <div className="text-xs text-600">
                                        Monto a Financiar
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-6">
                                    <div className="bg-white border-round-lg p-3 text-center shadow-1">
                                      <div className="text-lg font-bold text-orange-600">
                                        {formatPrice(resultado.totalIntereses)}
                                      </div>
                                      <div className="text-xs text-600">
                                        Total Intereses
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-12">
                                    <div className="bg-white border-round-lg p-3 text-center shadow-1 mt-2">
                                      <div className="text-xl font-bold text-purple-600">
                                        {formatPrice(resultado.totalPagar)}
                                      </div>
                                      <div className="text-sm text-600">
                                        Total a Pagar
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-yellow-50 border-round-lg p-3 border-left-4 border-yellow-400">
                                  <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-info-circle text-yellow-600"></i>
                                    <span className="font-bold text-yellow-800">
                                      Información Importante
                                    </span>
                                  </div>
                                  <ul className="text-sm text-yellow-700 m-0 pl-3">
                                    <li>
                                      Los cálculos son estimativos y pueden
                                      variar según la institución financiera
                                    </li>
                                    <li>
                                      Se requiere buen historial crediticio
                                    </li>
                                    <li>
                                      Pueden aplicarse cargos adicionales por
                                      seguro y gestoría
                                    </li>
                                  </ul>
                                </div>

                                <Button
                                  label="Solicitar Este Financiamiento"
                                  icon="pi pi-send"
                                  className="p-button-success w-full"
                                  onClick={() => {
                                    toast.current?.show({
                                      severity: "success",
                                      summary: "¡Solicitud Enviada! 📋",
                                      detail: `Financiamiento solicitado para ${selectedVehicle?.marca} ${selectedVehicle?.modelo}`,
                                      life: 5000,
                                    });
                                  }}
                                />
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {financingData.precio === 0 && (
                        <div className="text-center py-6">
                          <i className="pi pi-calculator text-6xl text-400 mb-3"></i>
                          <h4 className="text-600 mb-2">Calculadora Lista</h4>
                          <p className="text-500 text-sm">
                            Ajusta los parámetros para ver tu mensualidad
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        )}
      </Dialog>

      {/* Diálogo de comparación de vehículos */}
      <Dialog
        visible={showCompare}
        onHide={() => setShowCompare(false)}
        header="Comparar Vehículos"
        style={{ width: "95vw", maxWidth: "1200px" }}
        maximizable
        className="compare-dialog"
      >
        <div className="compare-container">
          {compareList.length === 0 ? (
            <div className="text-center py-8">
              <i className="pi pi-balance-scale text-6xl text-400 mb-4"></i>
              <h3 className="text-600 mb-2">No hay vehículos para comparar</h3>
              <p className="text-500">
                Agrega vehículos usando el botón de comparación
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left font-bold text-900 border-b-2 border-blue-200">
                      Característica
                    </th>
                    {compareList.map((vehicle, index) => (
                      <th
                        key={vehicle.id}
                        className="p-3 text-center border-b-2 border-blue-200 min-w-64"
                      >
                        <div className="relative">
                          <Image
                            src={
                              vehicle.imagenes[0] ||
                              "/demo/images/placeholder-car.svg"
                            }
                            alt={`${vehicle.marca} ${vehicle.modelo}`}
                            width="120"
                            height="80"
                            className="border-round-lg object-cover mx-auto mb-2"
                          />
                          <h4 className="text-lg font-bold text-900 mb-1">
                            {vehicle.marca} {vehicle.modelo}
                          </h4>
                          <p className="text-2xl font-bold text-primary mb-2">
                            {formatPrice(vehicle.precio)}
                          </p>
                          <Button
                            icon="pi pi-times"
                            className="p-button-rounded p-button-danger p-button-sm absolute top-0 right-0"
                            onClick={() => {
                              setCompareList(
                                compareList.filter((v) => v.id !== vehicle.id)
                              );
                            }}
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Año
                    </td>
                    {compareList.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="p-3 text-center font-medium"
                      >
                        {vehicle.anio}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Kilometraje
                    </td>
                    {compareList.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="p-3 text-center font-medium"
                      >
                        {vehicle.kilometraje.toLocaleString()} km
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Color
                    </td>
                    {compareList.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="p-3 text-center font-medium"
                      >
                        {vehicle.color}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Transmisión
                    </td>
                    {compareList.map((vehicle) => (
                      <td key={vehicle.id} className="p-3 text-center">
                        <Tag value={vehicle.transmision} severity="success" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Combustible
                    </td>
                    {compareList.map((vehicle) => (
                      <td key={vehicle.id} className="p-3 text-center">
                        <Tag value={vehicle.combustible} severity="warning" />
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Ubicación
                    </td>
                    {compareList.map((vehicle) => (
                      <td
                        key={vehicle.id}
                        className="p-3 text-center font-medium"
                      >
                        {vehicle.ubicacion}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Estado
                    </td>
                    {compareList.map((vehicle) => (
                      <td key={vehicle.id} className="p-3 text-center">
                        <Badge
                          value={vehicle.estado}
                          severity={
                            vehicle.estado === "Disponible"
                              ? "success"
                              : "warning"
                          }
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-700 bg-gray-50">
                      Acciones
                    </td>
                    {compareList.map((vehicle) => (
                      <td key={vehicle.id} className="p-3 text-center">
                        <div className="flex flex-column gap-2">
                          <Button
                            label="Ver Detalles"
                            icon="pi pi-eye"
                            className="p-button-sm p-button-outlined"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setDetailDialog(true);
                              setShowCompare(false);
                            }}
                          />
                          <Button
                            label="Cotizar"
                            icon="pi pi-calculator"
                            className="p-button-sm p-button-success"
                            onClick={() => {
                              toast.current?.show({
                                severity: "success",
                                summary: "Cotización Solicitada",
                                detail: `Comparación de ${compareList.length} vehículos`,
                                life: 4000,
                              });
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Dialog>

      {/* Diálogo de Cotización */}
      <Dialog
        visible={cotizacionDialog}
        onHide={() => setCotizacionDialog(false)}
        header="Solicitar Cotización"
        style={{ width: "600px" }}
        className="cotizacion-dialog"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setCotizacionDialog(false)}
            />
            <Button
              label="Enviar Cotización"
              icon="pi pi-send"
              className="p-button-success"
              onClick={enviarCotizacion}
              disabled={
                !clienteData.nombre ||
                !clienteData.email ||
                !clienteData.telefono
              }
            />
          </div>
        }
      >
        {selectedVehicle && (
          <div className="cotizacion-form">
            {/* Información del vehículo seleccionado */}
            <Card className="mb-4 shadow-2 border-round-lg">
              <div className="flex align-items-center gap-3">
                <Image
                  src={
                    selectedVehicle.imagenes[0] ||
                    "/demo/images/placeholder-car.svg"
                  }
                  alt={selectedVehicle.marca}
                  width="80"
                  height="60"
                  className="border-round"
                  style={{ objectFit: "cover" }}
                />
                <div>
                  <h3 className="text-lg font-bold m-0 text-900">
                    {selectedVehicle.marca} {selectedVehicle.modelo}{" "}
                    {selectedVehicle.anio}
                  </h3>
                  <p className="text-600 m-0">
                    Precio: {formatPrice(selectedVehicle.precio)}
                  </p>
                  <Badge
                    value={selectedVehicle.estado}
                    severity={
                      selectedVehicle.estado === "Disponible"
                        ? "success"
                        : "warning"
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Formulario de datos del cliente */}
            <div className="form-section">
              <h4 className="text-xl font-bold mb-3 text-900">
                📋 Datos Personales
              </h4>
              <div className="grid">
                <div className="col-12">
                  <label className="block text-900 font-semibold mb-2">
                    Nombre Completo *
                  </label>
                  <InputText
                    value={clienteData.nombre}
                    onChange={(e) =>
                      setClienteData({ ...clienteData, nombre: e.target.value })
                    }
                    placeholder="Ingresa tu nombre completo"
                    className="w-full"
                    required
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block text-900 font-semibold mb-2">
                    Email *
                  </label>
                  <InputText
                    value={clienteData.email}
                    onChange={(e) =>
                      setClienteData({ ...clienteData, email: e.target.value })
                    }
                    placeholder="tu@email.com"
                    className="w-full"
                    type="email"
                    required
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block text-900 font-semibold mb-2">
                    Teléfono *
                  </label>
                  <InputText
                    value={clienteData.telefono}
                    onChange={(e) =>
                      setClienteData({
                        ...clienteData,
                        telefono: e.target.value,
                      })
                    }
                    placeholder="+52 55 1234 5678"
                    className="w-full"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="block text-900 font-semibold mb-2">
                    Documento de Identidad
                  </label>
                  <InputText
                    value={clienteData.documento}
                    onChange={(e) =>
                      setClienteData({
                        ...clienteData,
                        documento: e.target.value,
                      })
                    }
                    placeholder="INE, Pasaporte, etc."
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Información de financiamiento si aplica */}
            {financingData.precio > 0 && (
              <Card className="mt-4 shadow-2 border-round-lg bg-blue-50">
                <h4 className="text-lg font-bold mb-3 text-900">
                  💰 Información de Financiamiento
                </h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="text-center p-3 bg-white border-round-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(financingData.enganche)}
                      </div>
                      <div className="text-sm text-600">Enganche</div>
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="text-center p-3 bg-white border-round-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(
                          calcularFinanciamiento(
                            financingData.precio,
                            financingData.enganche,
                            financingData.plazo,
                            financingData.tasaInteres
                          ).pagoMensual
                        )}
                      </div>
                      <div className="text-sm text-600">Pago Mensual</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2">
                      <div className="text-lg font-bold text-purple-600">
                        {financingData.plazo} meses
                      </div>
                      <div className="text-xs text-600">Plazo</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-2">
                      <div className="text-lg font-bold text-orange-600">
                        {financingData.tasaInteres}%
                      </div>
                      <div className="text-xs text-600">Tasa Anual</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Términos y condiciones */}
            <Card className="mt-4 shadow-2 border-round-lg">
              <div className="flex align-items-start gap-3">
                <Checkbox inputId="terms" checked={true} className="mt-1" />
                <div>
                  <label
                    htmlFor="terms"
                    className="text-900 font-semibold cursor-pointer"
                  >
                    Acepto los términos y condiciones
                  </label>
                  <p className="text-600 text-sm mt-1">
                    Al enviar esta cotización, autorizo el uso de mis datos para
                    fines comerciales y acepto ser contactado por el
                    concesionario.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ConcesionarioPage;
