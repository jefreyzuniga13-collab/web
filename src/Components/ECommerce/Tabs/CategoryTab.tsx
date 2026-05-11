import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import '@/Styles/Chat/DetailPanel/CategoryRow.css'
import Tooltip from '@mui/material/Tooltip';
// import noimageavailable from '@/assets/img/noimageavailable.webp'
import type { SelectedInterface } from "./ProductTab";
import vacio from '@/assets/vacio.png'

interface Props{
    cat?: CategoriaPCGInterface;
    setselectedCategory: (category: SelectedInterface) => void;
}

export const CategoryTab = ({
    cat,
    setselectedCategory
}: Props) => {
  return (
        <div className="category-row" onClick={()=> setselectedCategory({
            codGrupo: cat?.codGrupo ?? null,
            grupo: cat?.grupo ?? null
        })}>
            <div className="category-row__image">
                <img 
                // src={cat?.imagen ?? noimageavailable}
                src={cat?.imagen || vacio}
                // Para no mostrar texto, debido a que son muchas imagenes.
                // alt="category image"
                aria-label="category mage" 
                className="category-image"/>
            </div>
            <span className="category-row__label">
                <Tooltip title={cat?.grupo} children={
                <span>
                    {cat?.grupo ?? ""}
                </span>
                } />
            </span>
        </div>
  )
}
