const charMap = {
    'ä': 'a', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'ç': 'c',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ñ': 'n',
    'ö': 'o', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ß': 's',
    'ü': 'u', 'ù': 'u', 'ú': 'u', 'û': 'u',
    'ý': 'y', 'ÿ': 'y'
};

let last_submit;

const charMapRegex = new RegExp(`[${Object.keys(charMap).join('')}]`, 'g')

class ErrorE extends Error {
    constructor (message) {
        super(message)
        console.error(message)
    }
}

function getOptions() {
    const options_list = document.querySelectorAll('[class^="area-list_list"]')
    if (options_list.length === 0) {
        throw new ErrorE("Website strucuture invalid: option list not found")
    }
    const option_elements = Array.from(options_list[0].querySelectorAll("li"))
    const options = option_elements.map(el => {
        const option = el.innerText.toLowerCase()
        
        return {
            show: el.innerText,
            searchVal: Array.from(new Set([
                option, 
                option.replace(".", ""),
                option.replace(charMapRegex, match => charMap[match])
        ]))
    }})
    if (options.length === 0) {
        throw new ErrorE("Website strucuture invalid: options could not be extracted")
    }

    return options
}

function generateList(options, inputEl, formEl, inputElHeight, settings) {
    destroyOptionList()
    
    const option_list = document.createElement("ul")
    option_list.id = "option_list"
    option_list.classList.add("autocomplete-list")

    const hintEl = document.querySelector("[class^='game-type-map-input_hint']")
    let hintElHeight = hintEl ? hintEl.offsetHeight : 0

    option_list.style.top = `${inputElHeight + hintElHeight}px`

    const searchInput = inputEl.value.toLowerCase()
    const filteredOptions = options.filter(option => {
        return option.searchVal.some((ok) => ok.includes(searchInput))
    })

    if (filteredOptions.length < 1) {
        return
    } else if (filteredOptions.length === 1 && settings.autosubmit) {
        if (last_submit === filteredOptions[0].show) return
        setInput(filteredOptions[0].show, inputEl)
        submitInput(filteredOptions[0].show)
        return
    }

    filteredOptions.sort((a, b) => {
        const aStarts = a.searchVal.some(ok => ok.startsWith(searchInput))
        const bStarts = b.searchVal.some(ok => ok.startsWith(searchInput))

        if (aStarts && !bStarts) {
            return -1
        }
        if (!aStarts && bStarts) {
            return 1
        }
        return 0
    })

    filteredOptions.forEach((option, i) => {
        const li = document.createElement("li")
        li.classList.add("autocomplete-item")
        li.addEventListener("click", (e) => {
            e.stopPropagation()
            setInput(option.show, inputEl)
            destroyOptionList()
            if (settings.skip_fill_in) {
                submitInput(option.show)
            }
        })

        const selection = document.createElement("input")
        selection.type = "radio"
        selection.id = `autocomplete-option-${i}`
        if (i === 0) selection.checked = true
        selection.name = "option_selection"

        const label = document.createElement("label")
        label.htmlFor = `autocomplete-option-${i}`
        label.innerText = option.show
        
        li.appendChild(selection)
        li.appendChild(label)
        option_list.appendChild(li)
    });

    formEl.insertBefore(option_list, formEl.children[1])
} 

function submitInput(value = "") {
    if (value === last_submit) return
    const map_submit = document.querySelector('[class^="game-type-map-input_button"]')
    if (map_submit) map_submit.click()
    const flag_form = document.querySelectorAll('[class^="game-type-flag-input_form"]')[0]
    const flag_submit = flag_form.querySelector("button")
    if (flag_submit) flag_submit.click()
    if (flag_submit || map_submit) destroyOptionList()
    last_submit = value
}

function main(formEls, isFlag) {
    console.log("Seterra Autocomplete Extension initialized")
    browser.storage.sync.get({
        skip_fill_in: true,
        force_typeout: false,
        autosubmit: false
    }).then(settings => {
        const style = document.createElement("style")
        style.innerHTML = `
            .autocomplete-list {
                list-style: none;
                padding: 0;
                margin: 0;
                border: 1px solid #ccc;
                border-top: none;
                position: absolute;
                background-color: white;
                z-index: 999;
                width: 100%;
                box-sizing: border-box;
                max-height: 200px;
                overflow-y: auto;
            }
            .autocomplete-item input[type="radio"] {
                display: none;
                pointer-events: none;
            }
            .autocomplete-item label {
                display: block;
                padding: 8px 12px;
                cursor: pointer;
                pointer-events: none;
            }
            .autocomplete-item label:hover {
                background-color: #f0f0f0;
            }
            .autocomplete-item input[type="radio"]:checked + label {
                background-color: #e0e0e0;
            }
        `
        document.head.appendChild(style)

        const formEl = formEls[0]
        if (isFlag) {
            formEl.style.position = "relative"
        } else {
            formEl.style.overflow = "visible"
        }
        const inputEl = formEl.querySelector("input")
        inputEl.autocomplete = "off"
        const inputElHeight = inputEl.offsetHeight
    
        const options = getOptions()
    
        inputEl.addEventListener("input", () => {
            if (internalInput) {
                internalInput = false
                return
            }
            generateList(options, inputEl, formEl, inputElHeight, settings)
        })
        
        inputEl.addEventListener("keydown", (e) => {
            const option_list = document.getElementById("option_list")
            if (!option_list) return
            const selected_radio = option_list.querySelector("input[name='option_selection']:checked")
            if (selected_radio) {
                if (e.key === "Enter" && inputEl.value.toLowerCase() !== selected_radio.parentElement.innerText.toLowerCase()) {
                    if (!settings.skip_fill_in) e.preventDefault()
                    if (!settings.force_typeout) inputEl.value = selected_radio.parentElement.innerText
                    option_list.remove()
                } else if (e.key === "Enter") {
                    option_list.remove()
                } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    const selection_elements = Array.from(option_list.querySelectorAll("input[name='option_selection']"))
                    const currentIndex = selection_elements.findIndex(radio => radio.checked)
                    if (currentIndex > 0) {
                        selection_elements[currentIndex - 1].checked = true
                        selection_elements[currentIndex - 1].scrollIntoView({block: "nearest"})
                    
                    }

                } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    const selection_elements = Array.from(option_list.querySelectorAll("input[name='option_selection']"))
                    const currentIndex = selection_elements.findIndex(radio => radio.checked)
                    if (currentIndex < selection_elements.length - 1) {
                        selection_elements[currentIndex + 1].checked = true
                        selection_elements[currentIndex + 1].scrollIntoView({block: "nearest"})
                    }
                }
            } 
            if (e.key === "Escape") {
                option_list.remove()
            }
        })
    })
}

let internalInput = false

function setInput(value, inputEl) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
    nativeSetter.call(inputEl, value)

    // inputEl.value = value
    internalInput = true
    inputEl.dispatchEvent(new Event('input', { bubbles: true }))
}

function destroyOptionList() {
    const existing_option_list = document.getElementById("option_list")
    if (existing_option_list) {
        existing_option_list.remove()
    }
}

const interval = setInterval(() => {
    const startButton = document.querySelector('[data-qa="start-quiz-button"]')
    if (startButton) {
        clearInterval(interval)
        startButton.addEventListener("click", () => {
            const interval2 = setInterval(() => {
                const flagForm = document.querySelectorAll('[class^="game-type-flag-input_form"]')
                const mapForm = document.querySelectorAll('[class^="game-type-map-input_form"]')
                let formEls;
                let isFlag;
                if (flagForm.length === 1) {
                    formEls = flagForm
                    isFlag = true
                } else if (flagForm.length > 1 || mapForm.length > 1) {
                    throw new ErrorE("Invalid website structure: multiple matching elements found")
                } else if (mapForm.length === 1) {
                    formEls = mapForm
                    isFlag = false
                } else {
                    throw new ErrorE("Invalid website structure: no matching elements found")
                }
                if (formEls) {
                    clearInterval(interval2)
                    main(formEls, isFlag)
                }
            }, 50)
        })
    }
}, 50)